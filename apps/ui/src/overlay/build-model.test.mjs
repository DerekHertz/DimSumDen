// den-mvp/12 (ADR 0026 decisions 7 to 9): the den's own build, as pure functions.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { behindLine, buildLine, newVersionReady, rollbackState, rolledBackNote, shortSha } from "./build-model.mjs";
import { deliveryFacts, deliveryLine, deliveryRequests, previewLink } from "./delivery-model.mjs";
import { applyEvent } from "../state/apply-event.mjs";
import { createBridgeClient } from "../state/bridge-client.mjs";
import { createLiveStore } from "../state/live-store.mjs";

const A = "a1".repeat(20), B = "b2".repeat(20), C = "c3".repeat(20);
const build = (more = {}) => ({ live: { sha: B, at: "2026-10-13T14:05:00.000Z" }, previous: { sha: A }, rolledBack: null, ...more });
const when = (at) => `<${at}>`;

describe("which build is live", () => {
  test("the line names the short commit and when it went live", () => {
    assert.equal(buildLine(build(), { when }), "Den main @ b2b2b2b, live since <2026-10-13T14:05:00.000Z>");
    assert.equal(buildLine(build({ live: { sha: B, at: null } }), { when }), "Den main @ b2b2b2b");
    assert.equal(buildLine(build({ live: { sha: B, at: "not a date" } }), { when }), "Den main @ b2b2b2b");
    assert.match(buildLine(build()), /^Den main @ b2b2b2b, live since .*2026/);
    assert.equal(buildLine(build({ live: { sha: B, at: null, tag: "v0.1.0" } }), { when }), "Den v0.1.0 (b2b2b2b)");
  });
  test("a den that runs from the checkout, and anything that is not a build, shows no line", () => {
    for (const none of [null, undefined, {}, { live: null }, { live: { sha: "<img src=x>" } }, "build"]) assert.equal(buildLine(none), null);
  });
  test("shortSha never throws", () => {
    assert.deepEqual([shortSha(B), shortSha(null), shortSha(7)], ["b2b2b2b", "", ""]);
  });
});

describe("a new version is ready", () => {
  test("only when the live build is another one than the page's own", () => {
    assert.equal(newVersionReady(B, build()), false);
    assert.equal(newVersionReady(A, build()), true);
    assert.equal(newVersionReady(B, build({ live: { sha: A, at: null } })), true, "a roll back is a new version for an open tab too");
  });
  test("never without a build on both sides", () => {
    assert.equal(newVersionReady(null, build()), false);
    assert.equal(newVersionReady(B, null), false);
    assert.equal(newVersionReady("b2b2b2b", build()), false, "a short id is not compared");
  });
});

describe("roll back", () => {
  test("the button names both builds and carries the previous commit", () => {
    const s = rollbackState({ build: build(), steer: { state: "ready" } });
    assert.deepEqual(s, { show: true, to: A, name: "Go back from build b2b2b2b to the previous build a1a1a1a", detail: "Live: b2b2b2b. Previous: a1a1a1a.", enabled: true, reason: null });
  });
  test("with no previous build there is no button", () => {
    assert.equal(rollbackState({ build: build({ previous: null }), steer: { state: "ready" } }).show, false);
    assert.equal(rollbackState({ build: null, steer: { state: "ready" } }).show, false);
    assert.equal(rollbackState().show, false);
  });
  test("in demo mode, when not signed in and while one is under way the button is off, with the reason in words", () => {
    assert.deepEqual([rollbackState({ build: build(), steer: { state: "ready", demo: true } }).enabled, rollbackState({ build: build(), steer: { demo: true } }).reason], [false, "Demo mode: actions are off"]);
    assert.deepEqual([rollbackState({ build: build(), steer: { state: "none" } }).enabled, rollbackState({ build: build(), steer: { state: "none" } }).reason], [false, "Not signed in to steer"]);
    assert.deepEqual([rollbackState({ build: build(), steer: { state: "ready" }, inflight: true }).enabled, rollbackState({ build: build(), steer: { state: "ready" }, inflight: true }).reason], [false, "Going back…"]);
  });
  test("after a roll back the den says the live build is behind main, and an approval says what going live brings back", () => {
    const rolled = build({ live: { sha: A, at: null }, previous: { sha: B }, rolledBack: { sha: B, at: null } });
    assert.equal(behindLine(rolled), "The live build is behind main: build b2b2b2b was rolled back.");
    assert.equal(rolledBackNote(rolled), "Going live will also bring back build b2b2b2b, which you rolled back.");
    assert.deepEqual([behindLine(build()), rolledBackNote(build()), behindLine(null), rolledBackNote(undefined)], [null, null, null, null]);
  });
});

describe("a delivery that waits on its preview", () => {
  const d = (more = {}) => ({ id: "d-0123456789abcdef", ref: "fx/05-panel", title: "05: Slot panel", state: "paused", step: "preview", pause: { kind: "visual-verdict", reason: "a UI change waits for your verdict on its preview", next: "Open the preview. Approve it to merge it and put it live, or decline it with a note for the developer." }, candidate: { sha: C }, bounces: 0, declines: 0, ui: true, preview: { url: "http://127.0.0.1:45123/", sha: C }, verdict: null, release: null, evidence: { qa: "pass", security: null, risk: { clean: true, hits: 0 }, ci: null }, pr: null, ...more });
  const one = (delivery, snap = {}) => deliveryRequests({ deliveries: [delivery], ...snap })[0];

  test("the card has the preview link, says what Approve covers, and offers Decline", () => {
    const r = one(d());
    assert.equal(r.title, "05-panel waits for your verdict on its preview");
    assert.equal(r.previewUrl, "http://127.0.0.1:45123/");
    assert.deepEqual(r.primary, { action: "resume", verdict: "approve", label: "Approve: merge and go live" });
    assert.equal(r.decline, true);
    assert.match(r.covers, /the push, the pull request, the merge once the checks are green, and going live/);
    assert.equal(r.rolledBackNote, null);
    assert.deepEqual(r.lookAt, []);
  });
  test("the card lists what the developer said to look at", () => {
    assert.deepEqual(one(d({ lookAt: ["Needs you: a note box", 7, ""] })).lookAt, ["Needs you: a note box"]);
    assert.deepEqual(one(d({ pause: { kind: "no-commit", reason: "x", next: "" }, lookAt: ["a"] })).lookAt, []);
  });
  test("while a roll back is in effect the card says going live brings the rolled-back change with it", () => {
    const r = one(d(), { build: build({ rolledBack: { sha: A, at: null } }) });
    assert.equal(r.rolledBackNote, "Going live will also bring back build a1a1a1a, which you rolled back.");
  });
  test("only the bridge's own listener on this machine is a preview link", () => {
    for (const url of ["https://evil.example/", "http://127.0.0.1:45123/x", "http://127.0.0.1.evil.example:80/", "javascript:alert(1)", "http://localhost:45123/", 7, null]) {
      assert.equal(previewLink({ preview: { url } }), null, String(url));
    }
    assert.equal(one(d({ preview: { url: "https://evil.example/", sha: C } })).previewUrl, null);
  });
  test("a visual ticket with no UI path keeps its card, and can be declined too", () => {
    const r = one(d({ ui: false, preview: null }));
    assert.equal(r.title, "05-panel waits for your visual verdict");
    assert.deepEqual([r.primary.label, r.decline, r.previewUrl, r.covers], ["Approve and merge", true, null, null]);
  });
  test("the pauses after the merge say that the merge is done, in a sentence, with what to do next", () => {
    const update = one(d({ pause: { kind: "needs-update", reason: "the merged commit changes apps/bridge/server.mjs, which the running bridge does not have; the den must be updated before this change can go live", next: "Update the den (npm run den:update), then Resume to put this change live." } }));
    assert.equal(update.title, "05-panel is merged; the den must be updated before it goes live");
    assert.deepEqual([update.primary.label, update.decline, update.next], ["Resume", false, "Update the den (npm run den:update), then Resume to put this change live."]);
    const failed = one(d({ pause: { kind: "go-live-failed", reason: "the build failed (exit 1)", next: "The merge stands and nothing went live. Resume to try again." } }));
    assert.equal(failed.title, "05-panel is merged but did not go live");
    assert.equal(failed.reason, "the build failed (exit 1)");
  });
  test("the facts and the line say what the user did and what went live", () => {
    assert.deepEqual(deliveryFacts(d({ declines: 2, verdict: "approved", release: C })).slice(-3), ["declined by you 2 times", "approved by you", "live as c3c3c3c"]);
    assert.equal(deliveryLine(d({ state: "merged", pr: { number: 7 }, release: C })), "Merged as #7, live as c3c3c3c");
    assert.equal(deliveryLine(d({ state: "running", step: "preview" })), "Building the preview");
    assert.equal(deliveryLine(d({ state: "running", step: "go-live", pr: { number: 7 } })), "Putting the change live (#7)");
  });
});

describe("the page's own build", () => {
  const store = () => {
    let handlers;
    const s = createLiveStore({ connect: (h) => ((handlers = h), { close() {} }), fetchState: async () => ({}), now: () => 0 });
    s.start();
    return { s, send: (name, data) => handlers[name](data) };
  };
  test("it is the live build of the first snapshot, and nothing after replaces it", () => {
    const { s, send } = store();
    assert.equal(s.getState().ownBuild, null);
    send("onSnapshot", { seq: 1, tickets: [], build: build() });
    send("onChange", { seq: 2, type: "build", build: build({ live: { sha: C, at: null } }) }); // in the same tick as the snapshot
    assert.deepEqual([s.getState().ownBuild, s.getState().snapshot.build.live.sha], [B, C]);
    send("onSnapshot", { seq: 9, tickets: [], build: build({ live: { sha: C, at: null } }) }); // a reconnect
    assert.equal(s.getState().ownBuild, B);
    assert.equal(newVersionReady(s.getState().ownBuild, s.getState().snapshot.build), true);
  });
  test("a den that runs from the checkout has none, until a release is served", () => {
    const { s, send } = store();
    send("onSnapshot", { seq: 1, tickets: [], build: null });
    assert.equal(s.getState().ownBuild, null);
    send("onSnapshot", { seq: 2, tickets: [], build: build() });
    assert.equal(s.getState().ownBuild, B);
  });
});

describe("the build over the wire", () => {
  test("a build frame replaces the snapshot's build", () => {
    const state = { seq: 4, tickets: [], build: build() };
    const next = applyEvent(state, { seq: 5, type: "build", build: build({ live: { sha: C, at: null } }) });
    assert.deepEqual([next.seq, next.build.live.sha, state.build.live.sha], [5, C, B]);
    assert.equal(applyEvent(state, { seq: 5, type: "build" }).build, null);
  });
  test("the client sends a roll back and a decline as the bridge reads them", async () => {
    const sent = [];
    const client = createBridgeClient({ fetch: async (url, init) => (sent.push([url, JSON.parse(init.body)]), new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } })) });
    await client.rollback(A);
    await client.steerDelivery("d-0123456789abcdef", "resume", { verdict: "decline", note: "  Move the card left.  " });
    await client.steerDelivery("d-0123456789abcdef", "resume", { verdict: "approve", note: "ignored" });
    assert.deepEqual(sent, [
      ["/build/rollback", { to: A }],
      ["/deliveries/d-0123456789abcdef/resume", { verdict: "decline", note: "Move the card left." }],
      ["/deliveries/d-0123456789abcdef/resume", { verdict: "approve" }],
    ]);
    await assert.rejects(client.steerDelivery("d-0123456789abcdef", "resume", { verdict: "decline", note: " " }), { reason: "Write what should change first." });
    await assert.rejects(client.rollback(), { reason: "There is no previous build." });
    assert.equal(sent.length, 3, "a refused call sends nothing");
  });
});
