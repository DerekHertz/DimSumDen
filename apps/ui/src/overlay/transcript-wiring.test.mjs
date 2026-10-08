// den-v1/05: story 23 (opening, streaming and closing the transcript makes no network request) and the
// wiring checks the pure tests cannot see. Spec: handoffs/05-designer-spec.md and 05-designer-spec-2.md.
// Visual layout, motion, contrast, focus rings and the phone bottom sheet are human-verified (the user
// critiques the UI), not tested here.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createLiveStore } from "../state/live-store.mjs";
import { transcriptView } from "./transcript-view.mjs";
import { initialTranscriptState, transcriptKey, closeTranscript } from "./transcript-panel.mjs";
import { cardFor } from "./proximity-card.mjs";

const read = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");
const MODULES = ["../state/transcript-buffer.mjs", "./transcript-view.mjs", "./transcript-panel.mjs"];

describe("story 23: no network request", () => {
  test("open, stream, scroll state and close touch neither fetch nor /state", async () => {
    const realFetch = globalThis.fetch;
    const calls = [];
    globalThis.fetch = (...args) => { calls.push(args); throw new Error("network request attempted"); };
    try {
      let h = null;
      const fetches = [];
      const store = createLiveStore({
        connect: (handlers) => { h = handlers; return { close() {} }; },
        fetchState: async () => { fetches.push(1); return { schema: 1, seq: 99, tickets: [], frontier: [], usage: null, requests: [], agents: [] }; },
        now: () => 0,
      });
      store.start();
      h.onSnapshot({ schema: 1, seq: 10, tickets: [], frontier: [], usage: null, requests: [], agents: [] });
      const card = cardFor([{ id: "p", role: "developer", position: { x: -2, z: 0 }, agent: { id: "c-1", state: "working", capabilities: {} } }], [], { x: 0, z: 0, yaw: Math.PI / 2 });

      let panel = transcriptKey(initialTranscriptState(), { key: "f", card, mode: "walk" }).state;
      assert.equal(panel.agentId, "c-1");
      for (let i = 0; i < 5; i += 1) {
        h.onChange({ seq: 11 + i, type: "transcript", agentId: "c-1", entry: { kind: "message", role: "agent", text: `m${i}`, at: "t" } });
        transcriptView(store.getState().transcripts["c-1"], { expanded: [], atBottom: i % 2 === 0, seenThrough: i, connection: { phase: "live" } });
      }
      panel = transcriptKey(panel, { key: "Escape", card, mode: "walk" }).state;
      closeTranscript(panel);
      await Promise.resolve();
      assert.equal(fetches.length, 0, "no GET /state refetch");
      assert.deepEqual(calls, [], "no fetch call from the store, the view or the panel state");
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  test("the transcript modules contain no network primitive", () => {
    for (const rel of MODULES) {
      const src = read(rel);
      assert.doesNotMatch(src, /\bfetch\s*\(|XMLHttpRequest|EventSource|WebSocket|sendBeacon/, `${rel} must stay off the network`);
    }
  });
});

describe("wiring", () => {
  const overlayDir = new URL("../overlay/", import.meta.url);
  const sources = () => readdirSync(overlayDir)
    .filter((f) => /\.(jsx|mjs)$/.test(f) && !/\.test\./.test(f))
    .map((f) => read(`../overlay/${f}`)).join("\n");

  test("the card's F button no longer says the transcript is coming next", () => {
    assert.doesNotMatch(read("./ProximityCard.jsx"), /Transcript coming next/);
  });

  test("App mounts the transcript panel", () => {
    assert.match(read("../App.jsx"), /<TranscriptPanel\b/);
  });

  test("the panel carries the spec's roles, labels and copy", () => {
    const all = sources();
    for (const text of [
      'role="log"', 'role="complementary"', "Transcript for", "Close transcript", "Jump to latest",
      "Earlier entries were dropped", "Waiting for the agent's first message.", "Show details", "Hide details",
      "Waiting on you", "Unreadable event", "Agent ended:", "Reconnecting...", "Bridge offline: run npm run ui",
    ]) assert.ok(all.includes(text), `missing in overlay sources: ${text}`);
    assert.match(all, /aria-expanded/);
    assert.match(all, /aria-live/);
  });

  test("the stylesheet respects reduced motion for the panel", () => {
    const css = read("../scene/procedural/den.css") + read("../styles.css");
    assert.match(css, /\.transcript/);
    assert.match(css, /prefers-reduced-motion/);
  });
});
