// den-v1/05 criterion 1 at the live store: transcript frames from the SSE stream feed a bounded per-agent buffer.
// Seam: createLiveStore (existing contract, see live-store.test.mjs) with one new field:
//   store.getState().transcripts = { [agentId]: { entries, dropped } }   ({} before any frame)
// A change frame { seq, type: "transcript", agentId, entry } is in the normal seq sequence: it advances
// snapshot.seq, does not refetch /state, and does not touch tickets or agents. Buffers survive a new
// snapshot (reconnect): the panel keeps its entries while "Reconnecting..." shows.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createLiveStore } from "./live-store.mjs";
import { TRANSCRIPT_CAP } from "./transcript-buffer.mjs";

const snap = (seq) => ({ schema: 1, seq, sessions: 1, tickets: [{ ref: "f/01-a", feature: "f", title: "a", status: "ready-for-agent", ready: true, gate: null }], frontier: [], usage: null, requests: [], agents: [{ id: "c-1" }, { id: "c-2" }] });
const frame = (seq, agentId, entry) => ({ seq, type: "transcript", agentId, entry });
const msg = (text) => ({ kind: "message", role: "agent", text, at: "2026-10-08T14:02:00Z" });

function makeStore() {
  let handlers = null;
  const fetches = [];
  const store = createLiveStore({
    connect: (h) => { handlers = h; return { close() {} }; },
    fetchState: async () => { fetches.push(1); return snap(500); },
    now: () => 0,
  });
  store.start();
  return { store, fetches, h: () => handlers };
}

describe("the live store keeps a transcript buffer per agent", () => {
  test("before any frame the transcripts are empty", () => {
    const { store } = makeStore();
    assert.deepEqual(store.getState().transcripts, {});
  });

  test("a transcript frame appends to that agent's buffer, advances seq, and needs no refetch", async () => {
    const { store, fetches, h } = makeStore();
    h().onSnapshot(snap(10));
    h().onChange(frame(11, "c-1", msg("hello")));
    h().onChange(frame(12, "c-2", msg("other agent")));
    h().onChange(frame(13, "c-1", msg("again")));
    const s = store.getState();
    assert.deepEqual(s.transcripts["c-1"].entries.map((e) => e.text), ["hello", "again"]);
    assert.deepEqual(s.transcripts["c-2"].entries.map((e) => e.text), ["other agent"]);
    assert.equal(s.snapshot.seq, 13);
    assert.deepEqual(s.snapshot.tickets, snap(10).tickets, "tickets untouched");
    await Promise.resolve();
    assert.equal(fetches.length, 0, "an in-sequence transcript frame never refetches /state");
  });

  test("subscribers are notified and get a new state object per frame", () => {
    const { store, h } = makeStore();
    h().onSnapshot(snap(10));
    let calls = 0;
    store.subscribe(() => { calls += 1; });
    const before = store.getState();
    h().onChange(frame(11, "c-1", msg("hi")));
    assert.ok(calls >= 1);
    assert.notEqual(store.getState(), before);
    assert.notEqual(store.getState().transcripts, before.transcripts);
  });

  test("beyond the cap the oldest entries are dropped", () => {
    const { store, h } = makeStore();
    h().onSnapshot(snap(10));
    for (let i = 0; i < TRANSCRIPT_CAP + 3; i += 1) h().onChange(frame(11 + i, "c-1", msg(`m${i}`)));
    const b = store.getState().transcripts["c-1"];
    assert.equal(b.entries.length, TRANSCRIPT_CAP);
    assert.equal(b.dropped, 3);
    assert.equal(b.entries[0].text, "m3");
    assert.equal(b.entries.at(-1).text, `m${TRANSCRIPT_CAP + 2}`);
  });

  test("a malformed transcript entry is stored as an unreadable row and the stream carries on", () => {
    const { store, h } = makeStore();
    h().onSnapshot(snap(10));
    h().onChange(frame(11, "c-1", { kind: "hologram" }));
    h().onChange(frame(12, "c-1", msg("still here")));
    const entries = store.getState().transcripts["c-1"].entries;
    assert.deepEqual(entries.map((e) => e.kind), ["unreadable", "message"]);
    assert.equal(entries[0].type, "hologram");
  });

  test("buffers survive a fresh snapshot (reconnect) and a connection error", () => {
    const { store, h } = makeStore();
    h().onSnapshot(snap(10));
    h().onChange(frame(11, "c-1", msg("kept")));
    h().onError();
    assert.equal(store.getState().transcripts["c-1"].entries.length, 1);
    h().onSnapshot(snap(40));
    assert.deepEqual(store.getState().transcripts["c-1"].entries.map((e) => e.text), ["kept"]);
  });

  test("an ordinary change frame leaves the transcripts alone", () => {
    const { store, h } = makeStore();
    h().onSnapshot(snap(10));
    h().onChange(frame(11, "c-1", msg("kept")));
    h().onChange({ seq: 12, type: "frontier", refs: ["f/01-a"] });
    assert.deepEqual(store.getState().transcripts["c-1"].entries.map((e) => e.text), ["kept"]);
  });
});
