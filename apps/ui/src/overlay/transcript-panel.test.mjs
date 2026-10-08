// den-v1/05 criteria 2 and 3 (open and close behaviour, "F on a card with no agent does nothing and the
// reason stays visible") plus the user's 2026-10-08 answers Q3 (panel pinned to its agent) and Q6 (walk mode only).
// Seam: apps/ui/src/overlay/transcript-panel.mjs, a pure key and click reducer (qa pinned the contract).
//   initialTranscriptState() -> { agentId: null, notice: null }      agentId = the agent the panel is open for
//   transcriptKey(state, { key, card, mode }) -> { state, handled }
//     key: a KeyboardEvent.key; card: cardFor() output or null; mode: "walk" | "diorama"
//     handled = the key was consumed here, so walk mode must not act on it (Esc closes the panel first; a second
//     Esc, with the panel closed, is unhandled and leaves walk mode)
//   transcriptToggle(state, card) -> state     click on the card's F button (cursor free); same rule as the F key
//   closeTranscript(state) -> state            the Close button
// F rules: panel closed + card.actions.F.enabled -> opens for card.agentId; panel open -> closes (F again), whatever
// the card; card with F disabled -> nothing opens and notice = actions.F.reason (the polite live region); no card -> nothing.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { initialTranscriptState, transcriptKey, transcriptToggle, closeTranscript } from "./transcript-panel.mjs";
import { cardFor } from "./proximity-card.mjs";

const viewer = { x: 0, z: 0, yaw: Math.PI / 2 };
const live = (id, extra = {}) => cardFor([{ id: `p-${id}`, role: "developer", position: { x: -2, z: 0 }, agent: { id, ref: "den-v1/05-transcript-f", state: "working", capabilities: { send: true, approve: true }, ...extra } }], [], viewer);
const resident = () => cardFor([{ id: "qa", name: "Mei", role: "qa", position: { x: -2, z: 0 } }], [], viewer);
const key = (state, k, card, mode = "walk") => transcriptKey(state, { key: k, card, mode });
const open = (id = "c-1") => key(initialTranscriptState(), "f", live(id)).state;

describe("opening and closing", () => {
  test("it starts closed with no notice", () => {
    assert.deepEqual(initialTranscriptState(), { agentId: null, notice: null });
  });

  test("F on a card with a running agent opens the transcript for that agent", () => {
    const { state, handled } = key(initialTranscriptState(), "f", live("c-1"));
    assert.equal(state.agentId, "c-1");
    assert.equal(state.notice, null);
    assert.equal(handled, true);
  });

  test("capital F (caps lock or shift) opens it too", () => {
    assert.equal(key(initialTranscriptState(), "F", live("c-1")).state.agentId, "c-1");
  });

  test("F again closes it", () => {
    const { state, handled } = key(open(), "f", live("c-1"));
    assert.equal(state.agentId, null);
    assert.equal(handled, true);
  });

  test("F again closes it even after the user walked away from the card", () => {
    assert.equal(key(open(), "f", null).state.agentId, null);
  });

  test("Esc closes an open panel and is consumed, so the first Esc does not leave walk mode", () => {
    const { state, handled } = key(open(), "Escape", live("c-1"));
    assert.equal(state.agentId, null);
    assert.equal(handled, true);
  });

  test("Esc with the panel closed is not consumed, so it leaves walk mode as before", () => {
    const start = initialTranscriptState();
    const { state, handled } = key(start, "Escape", live("c-1"));
    assert.equal(handled, false);
    assert.deepEqual(state, start);
  });

  test("the Close button closes it", () => {
    assert.equal(closeTranscript(open()).agentId, null);
  });

  test("clicking F with the cursor free opens it, and clicking again closes it", () => {
    const opened = transcriptToggle(initialTranscriptState(), live("c-1"));
    assert.equal(opened.agentId, "c-1");
    assert.equal(transcriptToggle(opened, live("c-1")).agentId, null);
  });
});

describe("F on a card with no agent does nothing and the reason stays visible", () => {
  test("a resident panda (no agent running): nothing opens and the reason is the notice", () => {
    const card = resident();
    assert.equal(card.actions.F.enabled, false);
    const { state, handled } = key(initialTranscriptState(), "f", card);
    assert.equal(state.agentId, null);
    assert.equal(state.notice, "no agent running");
    assert.equal(state.notice, card.actions.F.reason, "the notice repeats the card's own reason");
    assert.equal(handled, true);
  });

  test("clicking a disabled F does the same", () => {
    const state = transcriptToggle(initialTranscriptState(), resident());
    assert.equal(state.agentId, null);
    assert.equal(state.notice, "no agent running");
  });

  test("an agent that already ended has no transcript to open", () => {
    const card = live("c-1", { state: "done" });
    assert.equal(card.actions.F.enabled, false);
    assert.equal(key(initialTranscriptState(), "f", card).state.agentId, null);
  });

  test("F with no card in reach opens nothing and says nothing", () => {
    const start = initialTranscriptState();
    const { state, handled } = key(start, "f", null);
    assert.deepEqual(state, start);
    assert.equal(handled, false);
  });

  test("a successful open clears an old notice, and closing clears it", () => {
    const noticed = key(initialTranscriptState(), "f", resident()).state;
    const opened = key(noticed, "f", live("c-1")).state;
    assert.equal(opened.notice, null);
    assert.equal(closeTranscript({ agentId: "c-1", notice: "stale" }).notice, null);
  });

  test("an open panel is not disturbed by pressing F on a disabled card: F closes it", () => {
    assert.equal(key(open(), "f", resident()).state.agentId, null);
  });
});

describe("pinned to the agent, walk mode only", () => {
  test("the panel stays open for its agent when the nearby card changes or goes away (Q3)", () => {
    const start = open("c-1");
    for (const card of [null, live("c-2"), resident()]) {
      const { state, handled } = key(start, "w", card);
      assert.equal(state.agentId, "c-1");
      assert.equal(handled, false, "walking keys are not consumed");
    }
  });

  test("the diorama does not open the transcript (Q6)", () => {
    const start = initialTranscriptState();
    const { state, handled } = key(start, "f", live("c-1"), "diorama");
    assert.equal(state.agentId, null);
    assert.equal(handled, false);
  });

  test("the reducer never mutates its input", () => {
    const frozen = Object.freeze({ agentId: "c-1", notice: null });
    const { state } = key(frozen, "f", live("c-1"));
    assert.notEqual(state, frozen);
    assert.equal(frozen.agentId, "c-1");
  });
});
