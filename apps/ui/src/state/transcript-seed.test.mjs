// den-v1 loop S2: the bridge now sends real transcript frames. Two additions to the den-v1/05 buffer contract:
//   - an entry may carry `id` (the bridge's per-agent entry number). A frame whose id is already in the buffer replaces
//     that entry in place and keeps its `n` (a tool call gets its result, a permission request its answer). A frame for
//     an id the buffer has already dropped is ignored. Entries with no id append as before.
//   - seedTranscripts(buffers, fromSnapshot) -> buffers: the snapshot's `transcripts` ({ [agentId]: { entries, dropped } })
//     replaces the buffer of each agent it names, with n = id, and leaves other agents' buffers alone. Anything that is
//     not that shape is skipped, and an entry of an unknown kind becomes an "unreadable" row, as with frames.
//   The live store seeds from every snapshot (first load, reconnect, refetch), so a reloaded page refills F.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { appendTranscript, seedTranscripts } from "./transcript-buffer.mjs";
import { createLiveStore } from "./live-store.mjs";

const tool = (id, over = {}) => ({ id, kind: "tool", name: "Read", summary: "a.md", status: "running", at: "2026-10-10T10:00:00Z", ...over });
const msg = (id, text) => ({ ...(id ? { id } : {}), kind: "message", role: "agent", text, at: "2026-10-10T10:00:00Z" });

describe("appendTranscript: a frame with a known id replaces its entry", () => {
  test("the entry is replaced in place, keeps its n, and no row is added", () => {
    let b = appendTranscript({}, "c-1", msg(1, "one"));
    b = appendTranscript(b, "c-1", tool(2));
    b = appendTranscript(b, "c-1", msg(3, "three"));
    const before = b;
    b = appendTranscript(b, "c-1", tool(2, { status: "done", result: "ok" }));
    assert.deepEqual(b["c-1"].entries.map((e) => [e.n, e.kind, e.status ?? null]), [[1, "message", null], [2, "tool", "done"], [3, "message", null]]);
    assert.equal(b["c-1"].entries[1].result, "ok");
    assert.equal(before["c-1"].entries[1].status, "running", "the earlier buffer is not mutated");
    assert.equal(b["c-1"].dropped, 0);
  });

  test("an update for an entry the buffer already dropped is ignored", () => {
    let b = {};
    for (let i = 1; i <= 5; i += 1) b = appendTranscript(b, "c-1", msg(i, `m${i}`), 3);
    assert.deepEqual(b["c-1"].entries.map((e) => e.id), [3, 4, 5]);
    const same = appendTranscript(b, "c-1", tool(2, { status: "done" }), 3);
    assert.deepEqual(same["c-1"], b["c-1"]);
  });

  test("entries with no id still append, one row each", () => {
    let b = appendTranscript({}, "c-1", msg(null, "a"));
    b = appendTranscript(b, "c-1", msg(null, "a"));
    assert.deepEqual(b["c-1"].entries.map((e) => e.n), [1, 2]);
  });
});

describe("seedTranscripts: the snapshot refills the buffers", () => {
  test("an agent's buffer comes from the snapshot, numbered by id, and later frames continue from it", () => {
    let b = seedTranscripts({}, { "c-1": { entries: [msg(8, "eight"), tool(9)], dropped: 7 } });
    assert.deepEqual(b["c-1"].entries.map((e) => e.n), [8, 9]);
    assert.equal(b["c-1"].dropped, 7);
    b = appendTranscript(b, "c-1", tool(9, { status: "done" }));
    b = appendTranscript(b, "c-1", msg(10, "ten"));
    assert.deepEqual(b["c-1"].entries.map((e) => [e.n, e.status ?? null]), [[8, null], [9, "done"], [10, null]]);
  });

  test("agents the snapshot does not name keep their buffers; the ones it names are replaced, not merged", () => {
    const mine = appendTranscript(appendTranscript({}, "c-old", msg(1, "kept")), "c-1", msg(1, "stale"));
    const b = seedTranscripts(mine, { "c-1": { entries: [msg(1, "fresh"), msg(2, "more")], dropped: 0 } });
    assert.deepEqual(b["c-old"], mine["c-old"]);
    assert.deepEqual(b["c-1"].entries.map((e) => e.text), ["fresh", "more"]);
    assert.equal(mine["c-1"].entries[0].text, "stale", "the input is not mutated");
  });

  test("a snapshot with no transcripts, or a malformed one, changes nothing and never throws", () => {
    const mine = appendTranscript({}, "c-1", msg(1, "kept"));
    for (const bad of [undefined, null, 7, "x", [], { "c-1": null }, { "c-1": { entries: "no" } }, { "c-1": 7 }]) {
      assert.deepEqual(seedTranscripts(mine, bad), mine, JSON.stringify(bad));
    }
  });

  test("an entry of an unknown kind or shape becomes an unreadable row; a bad dropped count is 0", () => {
    const b = seedTranscripts({}, { "c-1": { entries: [{ id: 1, kind: "hologram" }, null, msg(3, "ok")], dropped: -4 } });
    assert.deepEqual(b["c-1"].entries.map((e) => e.kind), ["unreadable", "unreadable", "message"]);
    assert.equal(b["c-1"].dropped, 0);
    assert.deepEqual(b["c-1"].entries.map((e) => e.n), [1, 2, 3]);
  });
});

describe("the live store seeds its transcripts from each snapshot", () => {
  const snap = (seq, transcripts) => ({ schema: 1, seq, sessions: 1, tickets: [], frontier: [], usage: null, requests: [], agents: [{ id: "c-1" }], ...(transcripts ? { transcripts } : {}) });
  function makeStore(refetched) {
    let handlers = null;
    const store = createLiveStore({ connect: (h) => { handlers = h; return { close() {} }; }, fetchState: async () => refetched, now: () => 0 });
    store.start();
    return { store, h: () => handlers };
  }

  test("a page loaded mid-run shows what the bridge kept, then follows the frames", () => {
    const { store, h } = makeStore();
    h().onSnapshot(snap(40, { "c-1": { entries: [msg(1, "earlier"), tool(2)], dropped: 0 } }));
    assert.deepEqual(store.getState().transcripts["c-1"].entries.map((e) => e.n), [1, 2]);
    h().onChange({ seq: 41, type: "transcript", agentId: "c-1", entry: tool(2, { status: "done", result: "ok" }) });
    h().onChange({ seq: 42, type: "transcript", agentId: "c-1", entry: msg(3, "later") });
    const entries = store.getState().transcripts["c-1"].entries;
    assert.deepEqual(entries.map((e) => [e.n, e.kind, e.status ?? null]), [[1, "message", null], [2, "tool", "done"], [3, "message", null]]);
  });

  test("a refetched snapshot (a seq gap) reseeds, so no frame is lost or doubled", async () => {
    const { store, h } = makeStore(snap(60, { "c-1": { entries: [msg(1, "a"), msg(2, "b"), msg(3, "c")], dropped: 0 } }));
    h().onSnapshot(snap(40, { "c-1": { entries: [msg(1, "a")], dropped: 0 } }));
    h().onChange({ seq: 43, type: "transcript", agentId: "c-1", entry: msg(3, "c") }); // 41 and 42 were missed
    await new Promise((r) => setImmediate(r));
    assert.deepEqual(store.getState().transcripts["c-1"].entries.map((e) => e.text), ["a", "b", "c"]);
  });

  test("a snapshot without transcripts keeps the buffers (den-v1/05: they survive a reconnect)", () => {
    const { store, h } = makeStore();
    h().onSnapshot(snap(40, { "c-1": { entries: [msg(1, "kept")], dropped: 0 } }));
    h().onSnapshot(snap(41));
    assert.deepEqual(store.getState().transcripts["c-1"].entries.map((e) => e.text), ["kept"]);
  });
});
