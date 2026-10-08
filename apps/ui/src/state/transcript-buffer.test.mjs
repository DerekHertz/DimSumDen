// den-v1/05 criterion 1: "Events for an agent append to its buffer; the buffer drops the oldest beyond its cap."
// Seam: apps/ui/src/state/transcript-buffer.mjs, a pure module (qa pinned the contract; spec in
// .scratch/den-v1/handoffs/05-designer-spec.md and 05-designer-spec-2.md).
//   TRANSCRIPT_CAP = 200 (user, 2026-10-08)
//   appendTranscript(buffers, agentId, entry, cap = TRANSCRIPT_CAP) -> NEW buffers object, input never mutated
//     buffers = { [agentId]: { entries: Entry[], dropped: number } }, oldest first
//     each stored entry is the given entry plus n, its 1-based arrival number for that agent (n = dropped + index + 1)
//   entryFromFrame(frame) -> { agentId, entry } | null
//     The ONE place the SSE frame shape lives (organism-infra/106 has not landed, so this is the fixture shape):
//     frame = { seq, type: "transcript", agentId, entry }; any other frame type -> null; no string agentId -> null.
//     Entry kinds: message {role:"agent"|"user", text, at}, tool {id, name, summary, status, input, result, at},
//     permission {name}, ended {state}. Any other entry (unknown kind, not an object) becomes
//     { kind: "unreadable", type: <the kind if it is a string, else "unknown"> } and never throws.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { TRANSCRIPT_CAP, appendTranscript, entryFromFrame } from "./transcript-buffer.mjs";

const msg = (text) => ({ kind: "message", role: "agent", text, at: "2026-10-08T14:02:00Z" });

describe("appendTranscript", () => {
  test("the cap is 200 events per agent", () => {
    assert.equal(TRANSCRIPT_CAP, 200);
  });

  test("events append in arrival order and are numbered from 1", () => {
    let b = {};
    b = appendTranscript(b, "c-1", msg("first"));
    b = appendTranscript(b, "c-1", msg("second"));
    assert.deepEqual(b["c-1"].entries.map((e) => e.text), ["first", "second"]);
    assert.deepEqual(b["c-1"].entries.map((e) => e.n), [1, 2]);
    assert.equal(b["c-1"].dropped, 0);
  });

  test("each agent has its own buffer: no cross-agent leakage", () => {
    let b = {};
    b = appendTranscript(b, "c-1", msg("for one"));
    b = appendTranscript(b, "c-2", msg("for two"));
    assert.deepEqual(b["c-1"].entries.map((e) => e.text), ["for one"]);
    assert.deepEqual(b["c-2"].entries.map((e) => e.text), ["for two"]);
  });

  test("beyond the cap the oldest entry is dropped first and the drop count rises", () => {
    let b = {};
    for (let i = 0; i < TRANSCRIPT_CAP + 5; i += 1) b = appendTranscript(b, "c-1", msg(`m${i}`));
    const { entries, dropped } = b["c-1"];
    assert.equal(entries.length, TRANSCRIPT_CAP);
    assert.equal(dropped, 5);
    assert.equal(entries[0].text, "m5");
    assert.equal(entries.at(-1).text, `m${TRANSCRIPT_CAP + 4}`);
    assert.equal(entries[0].n, 6, "arrival numbers keep counting across drops");
    assert.equal(entries.at(-1).n, TRANSCRIPT_CAP + 5);
  });

  test("one agent hitting its cap does not trim another agent", () => {
    let b = appendTranscript({}, "quiet", msg("hello"));
    for (let i = 0; i < 10; i += 1) b = appendTranscript(b, "busy", msg(`m${i}`), 3);
    assert.equal(b.busy.entries.length, 3);
    assert.equal(b.busy.dropped, 7);
    assert.equal(b.quiet.entries.length, 1);
    assert.equal(b.quiet.dropped, 0);
  });

  test("a custom cap is honoured", () => {
    let b = {};
    for (let i = 0; i < 4; i += 1) b = appendTranscript(b, "c-1", msg(`m${i}`), 2);
    assert.deepEqual(b["c-1"].entries.map((e) => e.text), ["m2", "m3"]);
    assert.equal(b["c-1"].dropped, 2);
  });

  test("the input is never mutated and the result is a new object", () => {
    const before = Object.freeze({ "c-1": Object.freeze({ entries: Object.freeze([Object.freeze({ ...msg("old"), n: 1 })]), dropped: 0 }) });
    const after = appendTranscript(before, "c-1", msg("new"));
    assert.notEqual(after, before);
    assert.equal(before["c-1"].entries.length, 1);
    assert.equal(after["c-1"].entries.length, 2);
  });
});

describe("entryFromFrame", () => {
  test("a transcript frame yields its agent id and entry", () => {
    const entry = msg("hello");
    assert.deepEqual(entryFromFrame({ seq: 4, type: "transcript", agentId: "c-1", entry }), { agentId: "c-1", entry });
  });

  test("frames that are not transcript frames are ignored", () => {
    assert.equal(entryFromFrame({ seq: 4, type: "ticket", ref: "f/01-a" }), null);
    assert.equal(entryFromFrame({ seq: 4, type: "agent", agent: { id: "c-1" } }), null);
    assert.equal(entryFromFrame(null), null);
    assert.equal(entryFromFrame(undefined), null);
  });

  test("a transcript frame with no usable agent id is ignored, not thrown on", () => {
    assert.equal(entryFromFrame({ seq: 4, type: "transcript", entry: msg("x") }), null);
    assert.equal(entryFromFrame({ seq: 4, type: "transcript", agentId: 7, entry: msg("x") }), null);
  });

  test("a malformed or unknown entry becomes an unreadable row carrying its type, and never throws", () => {
    const type = (entry) => entryFromFrame({ seq: 4, type: "transcript", agentId: "c-1", entry }).entry;
    assert.deepEqual(type({ kind: "hologram", text: "x" }), { kind: "unreadable", type: "hologram" });
    assert.deepEqual(type(null), { kind: "unreadable", type: "unknown" });
    assert.deepEqual(type(42), { kind: "unreadable", type: "unknown" });
    assert.deepEqual(type("text"), { kind: "unreadable", type: "unknown" });
    assert.deepEqual(type([]), { kind: "unreadable", type: "unknown" });
    assert.deepEqual(type({ kind: { nested: true } }), { kind: "unreadable", type: "unknown" });
  });
});
