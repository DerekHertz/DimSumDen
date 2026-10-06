// den-layout/03 (absorbs den-v1/02): the pure adapter from a live-store snapshot to actor state for
// PR #162's role pandas. Seam: liveActorsFromSnapshot(snapshot, { now }) in ./live-actors.mjs.
//
// Contract these tests pin (the developer may add fields, not drop these):
//   liveActorsFromSnapshot(snapshot, { now? }) -> LiveActor[]
//   LiveActor = { role, ref, split, state, activity, bubble, task }
//     role   one of the 9 cell types; scenery roles never appear (they stay simulated)
//     split  false for the first live agent of a role, true for each further one
//     state  PR #162 actor state: 'working' | 'needs-you' | 'blocked'
//     bubble the latest tool (name and summary) while it is younger than TOOL_BUBBLE_TTL_MS, else ''
//     task   contains the ticket ref
//   A role with no live agent has no entry. An agent is live while its ticket holds a lock
//   (snapshot.tickets[].holder) and its snapshot.cells[] entry (matched by ref) is not ended.
import { test } from "node:test";
import assert from "node:assert/strict";
import { liveActorsFromSnapshot, TOOL_BUBBLE_TTL_MS } from "./live-actors.mjs";

const T0 = Date.parse("2026-10-06T10:00:00.000Z");
const iso = (ms) => new Date(ms).toISOString();

const ticket = (ref, status, cell, extra = {}) => ({
  ref,
  title: `${ref} title`,
  type: "feature",
  status,
  holder: cell ? { cell, since: iso(T0 - 60_000) } : null,
  lastCell: cell,
  gate: null,
  blockedBy: [],
  ...extra,
});
const cellRow = (ref, cellType, tool, extra = {}) => ({
  id: `c-${ref}`,
  ref,
  cellType,
  state: "working",
  startedAt: iso(T0 - 60_000),
  lastEventAt: iso(T0),
  tool,
  ...extra,
});
const snap = (tickets, cells = []) => ({ tickets, cells });
const byRole = (actors, role) => actors.filter((a) => a.role === role);

test("a bound agent maps to an actor of its role, working, with its ticket as the task", () => {
  const s = snap([ticket("fx/01-a", "claimed", "developer")], [cellRow("fx/01-a", "developer", { name: "Read", summary: "docs/adr/0011.md" })]);
  const actors = liveActorsFromSnapshot(s, { now: T0 + 1000 });
  assert.equal(actors.length, 1);
  const [a] = actors;
  assert.equal(a.role, "developer");
  assert.equal(a.ref, "fx/01-a");
  assert.equal(a.split, false);
  assert.equal(a.state, "working");
  assert.ok(a.task.includes("fx/01-a"), "task shows the ticket");
});

test("the bubble shows the agent's latest tool name and summary", () => {
  const s = snap([ticket("fx/01-a", "claimed", "qa")], [cellRow("fx/01-a", "qa", { name: "Bash", summary: "npm test" })]);
  const [a] = liveActorsFromSnapshot(s, { now: T0 + 1000 });
  assert.ok(a.bubble.includes("Bash"));
  assert.ok(a.bubble.includes("npm test"));
});

test("a tool call older than the TTL no longer shows; one just inside it still does", () => {
  const s = snap([ticket("fx/01-a", "claimed", "developer")], [cellRow("fx/01-a", "developer", { name: "Edit", summary: "src/x.mjs" })]);
  const inside = liveActorsFromSnapshot(s, { now: T0 + TOOL_BUBBLE_TTL_MS - 1 })[0];
  const outside = liveActorsFromSnapshot(s, { now: T0 + TOOL_BUBBLE_TTL_MS + 1 })[0];
  assert.ok(inside.bubble.includes("Edit"), "still shown just inside the TTL");
  assert.equal(outside.bubble, "", "gone after the TTL with no newer call");
  assert.equal(outside.state, "working", "the agent is still bound after its bubble fades");
});

test("a newer tool call replaces the bubble immediately", () => {
  const before = snap([ticket("fx/01-a", "claimed", "developer")], [cellRow("fx/01-a", "developer", { name: "Read", summary: "one.md" })]);
  const after = snap(
    [ticket("fx/01-a", "claimed", "developer")],
    [cellRow("fx/01-a", "developer", { name: "Grep", summary: "two" }, { lastEventAt: iso(T0 + 2000) })],
  );
  const a = liveActorsFromSnapshot(before, { now: T0 + 1000 })[0];
  const b = liveActorsFromSnapshot(after, { now: T0 + 2500 })[0];
  assert.ok(a.bubble.includes("Read"));
  assert.ok(b.bubble.includes("Grep"));
  assert.ok(!b.bubble.includes("Read"), "the old call is gone");
});

test("a bound agent with no tool call yet has an empty bubble, not a stale or invented one", () => {
  const s = snap([ticket("fx/01-a", "claimed", "architect")], []);
  const [a] = liveActorsFromSnapshot(s, { now: T0 });
  assert.equal(a.role, "architect");
  assert.equal(a.bubble, "");
});

test("the ticket's pose maps to the actor state: a gate or ready-for-human waits for the user, blocked stays blocked", () => {
  const s = snap([
    ticket("fx/01-a", "claimed", "developer", { gate: "merge" }),
    ticket("fx/02-b", "blocked", "qa"),
    ticket("fx/03-c", "claimed", "scout"),
  ]);
  const actors = liveActorsFromSnapshot(s, { now: T0 });
  assert.equal(byRole(actors, "developer")[0].state, "needs-you");
  assert.equal(byRole(actors, "qa")[0].state, "blocked");
  assert.equal(byRole(actors, "scout")[0].state, "working");
});

test("a second live agent of the same role is a split-off actor; the first stays the primary", () => {
  const s = snap([ticket("fx/01-a", "claimed", "developer"), ticket("fx/02-b", "claimed", "developer")], [
    cellRow("fx/01-a", "developer", { name: "Read", summary: "a" }),
    cellRow("fx/02-b", "developer", { name: "Write", summary: "b" }),
  ]);
  const devs = byRole(liveActorsFromSnapshot(s, { now: T0 + 1 }), "developer");
  assert.equal(devs.length, 2);
  assert.deepEqual(devs.map((d) => d.split), [false, true]);
  assert.deepEqual(devs.map((d) => d.ref), ["fx/01-a", "fx/02-b"]);
  assert.ok(devs[0].bubble.includes("Read") && devs[0].task.includes("fx/01-a"));
  assert.ok(devs[1].bubble.includes("Write") && devs[1].task.includes("fx/02-b"), "each panda carries its own agent's tool and ticket");
});

test("roles with no live agent have no actor, so they keep idle wandering", () => {
  const s = snap([ticket("fx/01-a", "claimed", "developer")]);
  const actors = liveActorsFromSnapshot(s, { now: T0 });
  assert.deepEqual(actors.map((a) => a.role), ["developer"]);
  assert.deepEqual(liveActorsFromSnapshot(snap([]), { now: T0 }), []);
  assert.deepEqual(liveActorsFromSnapshot(null, { now: T0 }), [], "no snapshot yet (bridge not connected) binds nothing");
});

test("a ticket with no lock is not a live agent: in-review and ready-for-human with no holder bind nothing", () => {
  const s = snap([ticket("fx/01-a", "in-review", null, { lastCell: "developer" }), ticket("fx/02-b", "ready-for-human", null, { lastCell: "qa" })]);
  assert.deepEqual(liveActorsFromSnapshot(s, { now: T0 }), []);
});

test("the 4 scenery pandas never come from live state, even if a holder names one", () => {
  const s = snap([
    ticket("fx/01-a", "claimed", "release-manager"),
    ticket("fx/02-b", "claimed", "knowledge-keeper"),
    ticket("fx/03-c", "claimed", "docs-writer"),
    ticket("fx/04-d", "claimed", "stem-cub"),
    ticket("fx/05-e", "claimed", "herald"),
  ]);
  const actors = liveActorsFromSnapshot(s, { now: T0 });
  assert.deepEqual(actors.map((a) => a.role), ["herald"]);
});

test("each of the 9 cell types binds to the matching role", () => {
  const roles = ["orchestrator", "product", "architect", "developer", "scout", "qa", "security", "designer", "herald"];
  const s = snap(roles.map((r, i) => ticket(`fx/${String(i + 1).padStart(2, "0")}-x`, "claimed", r)));
  const actors = liveActorsFromSnapshot(s, { now: T0 });
  assert.deepEqual(actors.map((a) => a.role).sort(), [...roles].sort());
  assert.ok(actors.every((a) => a.split === false));
});

test("when the agent's session ends, its panda is no longer bound", () => {
  const live = snap([ticket("fx/01-a", "claimed", "developer")], [cellRow("fx/01-a", "developer", { name: "Read", summary: "a" })]);
  assert.equal(liveActorsFromSnapshot(live, { now: T0 + 1 }).length, 1);
  // The lock is released: the ticket leaves the active set.
  const released = snap([ticket("fx/01-a", "in-review", null, { lastCell: "developer" })], live.cells);
  assert.deepEqual(liveActorsFromSnapshot(released, { now: T0 + 1 }), []);
  // The bridge reports the session over while the ticket still shows the claim.
  for (const state of ["terminated", "done", "failed"]) {
    const ended = snap([ticket("fx/01-a", "claimed", "developer")], [cellRow("fx/01-a", "developer", { name: "Read", summary: "a" }, { state })]);
    assert.deepEqual(liveActorsFromSnapshot(ended, { now: T0 + 1 }), [], `session state ${state} unbinds the panda`);
  }
});

test("the adapter is pure: same input and clock give the same output, and the snapshot is not mutated", () => {
  const s = snap([ticket("fx/01-a", "claimed", "developer")], [cellRow("fx/01-a", "developer", { name: "Read", summary: "a" })]);
  const frozen = JSON.stringify(s);
  const one = liveActorsFromSnapshot(s, { now: T0 + 1 });
  const two = liveActorsFromSnapshot(s, { now: T0 + 1 });
  assert.deepEqual(one, two);
  assert.equal(JSON.stringify(s), frozen);
});
