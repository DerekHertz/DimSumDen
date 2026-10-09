// den-v1/09: the proximity card in Demo mode. Contract (qa specify):
//   apps/ui/src/demo/demo-card.mjs exports demoCard(card, { transcripts }) -> card | null, pure, input untouched.
//   It returns the card with its actions rewritten: T, A and D are { enabled: false, reason: "Demo mode: actions are off" }
//   (even when the live card would allow them); F is { enabled: true, reason: null } only when transcripts[card.agentId]
//   holds at least one entry, else { enabled: false, reason: "Demo mode: no transcript recorded" }. Everything else on the
//   card (name, role, state, tool, approval, ref, agentId) is unchanged, so walk mode, the lantern line and the bubble work.
// Criterion: AC 3 (T, A, D greyed with the reason; F by the transcript-lines rule).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { demoCard } from "./demo-card.mjs";
import { DEMO_FIXTURE } from "./demo-fixture.mjs";
import { createDemoReplay } from "./demo-replay.mjs";
import { cardFor, pendingLine } from "../overlay/proximity-card.mjs";
import { initialTranscriptState, transcriptToggle } from "../overlay/transcript-panel.mjs";
import { clock, cardsOf } from "./demo-test-helpers.mjs";

const OFF = { enabled: false, reason: "Demo mode: actions are off" };
const NO_LINES = { enabled: false, reason: "Demo mode: no transcript recorded" };
const viewer = { x: 0, z: 0, yaw: Math.PI / 2 };

const agent = {
  id: "a1", ref: "demo/01-x", role: "developer", state: "needs-you", tool: { name: "Bash", summary: "ls" },
  capabilities: { send: true, approve: true },
};
const approval = { id: "ap1", agentId: "a1", status: "pending", tool: "Bash" };
const liveCard = (over = {}) => cardFor(
  [{ id: "p", name: "Dev", role: "developer", station: "Steamers", position: { x: -2, z: 0 }, ref: agent.ref, agent: { ...agent, ...over } }],
  [approval], viewer,
);
const lines = (id, n = 1) => ({ [id]: { entries: Array.from({ length: n }, (_, i) => ({ kind: "message", role: "agent", text: "hi", n: i + 1 })), dropped: 0 } });

describe("T, A and D", () => {
  test("a live card that would allow all four is greyed with the Demo mode reason, except F with lines", () => {
    const base = liveCard();
    for (const key of ["T", "F", "A", "D"]) assert.equal(base.actions[key].enabled, true, `${key} is live-enabled`);
    const card = demoCard(base, { transcripts: lines("a1") });
    assert.deepEqual(card.actions.T, OFF);
    assert.deepEqual(card.actions.A, OFF);
    assert.deepEqual(card.actions.D, OFF);
    assert.deepEqual(card.actions.F, { enabled: true, reason: null });
  });
  test("T, A and D stay greyed whatever the transcript holds", () => {
    for (const transcripts of [{}, lines("a1", 3), undefined]) {
      const card = demoCard(liveCard(), { transcripts });
      for (const key of ["T", "A", "D"]) assert.deepEqual(card.actions[key], OFF);
    }
  });
  test("a resident panda greys all four, T A D with the Demo reason and F with no transcript", () => {
    const resident = cardFor([{ id: "qa", name: "Mei", role: "qa", station: "Tea", position: { x: -2, z: 0 } }], [], viewer);
    const card = demoCard(resident, { transcripts: lines("a1") });
    assert.deepEqual(card.actions.T, OFF);
    assert.deepEqual(card.actions.A, OFF);
    assert.deepEqual(card.actions.D, OFF);
    assert.deepEqual(card.actions.F, NO_LINES);
  });
});

describe("F follows the recorded transcript lines", () => {
  test("lines for this agent enable it", () => {
    assert.deepEqual(demoCard(liveCard(), { transcripts: lines("a1", 2) }).actions.F, { enabled: true, reason: null });
  });
  test("no lines, an empty buffer, or lines only for another agent grey it with the no-transcript reason", () => {
    for (const transcripts of [{}, undefined, { a1: { entries: [], dropped: 0 } }, lines("someone-else", 4)]) {
      assert.deepEqual(demoCard(liveCard(), { transcripts }).actions.F, NO_LINES);
    }
  });
  test("pressing F opens the replayed transcript, or leaves the reason as the notice", () => {
    const open = transcriptToggle(initialTranscriptState(), demoCard(liveCard(), { transcripts: lines("a1") }));
    assert.equal(open.agentId, "a1");
    const shut = transcriptToggle(initialTranscriptState(), demoCard(liveCard(), { transcripts: {} }));
    assert.equal(shut.agentId, null);
    assert.equal(shut.notice, "Demo mode: no transcript recorded");
  });
  test("over the recording, F is enabled exactly when the replayed buffer holds a line for that agent", () => {
    const c = clock();
    const replay = createDemoReplay({ now: c.now });
    replay.start();
    let enabledSeen = false, greyedSeen = false;
    for (let ms = 0; ms < DEMO_FIXTURE.loopMs; ms += 1000) {
      c.at(ms);
      replay.tick();
      const { snapshot, transcripts } = replay.getState();
      for (const card of cardsOf(snapshot)) {
        const shown = demoCard(card, { transcripts });
        const has = (transcripts[card.agentId]?.entries.length ?? 0) > 0;
        assert.equal(shown.actions.F.enabled, has, `${card.agentId} at ${ms}`);
        assert.equal(shown.actions.F.reason, has ? null : NO_LINES.reason);
        if (has) enabledSeen = true; else greyedSeen = true;
      }
    }
    assert.ok(enabledSeen && greyedSeen, "the recording shows both the enabled and the greyed F");
  });
});

describe("the rest of the card", () => {
  test("walk mode keeps working: name, role, state, tool, ref, agent and the pending request are untouched", () => {
    const base = liveCard();
    const card = demoCard(base, { transcripts: lines("a1") });
    for (const key of ["id", "name", "role", "station", "state", "ref", "agentId", "tool", "approval"]) {
      assert.deepEqual(card[key], base[key], key);
    }
    assert.equal(pendingLine(card), "Waiting on you · Bash");
  });
  test("it never mutates the card or the transcripts it was given", () => {
    const base = liveCard();
    const transcripts = lines("a1");
    const before = JSON.stringify([base, transcripts]);
    demoCard(base, { transcripts });
    assert.equal(JSON.stringify([base, transcripts]), before);
  });
  test("no card in, no card out", () => {
    assert.equal(demoCard(null, { transcripts: {} }), null);
  });
});
