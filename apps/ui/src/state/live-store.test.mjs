// dimsumden-ui-v0/07 criterion "Snapshot updates re-render without reload (test)".
// Seam: createLiveStore, the state holder a React component subscribes to. Contract chosen by qa:
//   createLiveStore({ connect, fetchState, now }) -> store
//     connect({onOpen, onSnapshot, onChange, onError}) -> {close()}   (EventSource adapter, injected)
//     fetchState() -> Promise<snapshot>                                (GET /state, injected)
//     now() -> ms                                                      (clock, injected)
//   store.start(); store.close(); store.tick() (called on a timer by the UI, drives "offline")
//   store.getState() -> {snapshot, connection, metricsRevision}; a NEW object whenever anything changes
//   store.subscribe(fn) -> unsubscribe; fn is called after each change
//   Behaviour: snapshot frame sets the snapshot; change frames go through applyEvent; a seq gap
//   (applyEvent -> null) refetches /state; metrics-changed bumps metricsRevision; errors keep the
//   last snapshot on screen and mark the connection reconnecting.
// The last describe wires the store to a real startBridge over HTTP SSE (no fake bridge).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createLiveStore } from "./live-store.mjs";
import { OFFLINE_AFTER_MS } from "./connection.mjs";
import { startBridge } from "../../../bridge/server.mjs";
import { makeStateFixture, FEATURE } from "../../../bridge/bridge-fixture.mjs";

const ticket = (ref, extra = {}) => ({ ref, feature: ref.split("/")[0], title: ref, status: "ready-for-agent", ready: true, gate: null, ...extra });
const snap = (seq, tickets = [ticket("f/01-a")]) => ({ schema: 1, seq, sessions: 1, tickets, frontier: [], usage: null, requests: [] });

function fakeTransport() {
  let handlers = null;
  let closed = 0;
  return {
    connect(h) {
      handlers = h;
      return { close: () => { closed += 1; } };
    },
    get h() { return handlers; },
    get closed() { return closed; },
  };
}

function makeStore({ fetched = snap(50), clock = { t: 0 } } = {}) {
  const transport = fakeTransport();
  const fetches = [];
  const store = createLiveStore({
    connect: (h) => transport.connect(h),
    fetchState: async () => { fetches.push(1); return fetched; },
    now: () => clock.t,
  });
  return { store, transport, fetches, clock };
}

describe("createLiveStore with an injected transport", () => {
  test("before any snapshot: null snapshot, connecting", () => {
    const { store } = makeStore();
    store.start();
    const s = store.getState();
    assert.equal(s.snapshot, null);
    assert.equal(s.connection.phase, "connecting");
  });

  test("a snapshot frame becomes the state, goes live, and notifies subscribers", () => {
    const { store, transport } = makeStore();
    let calls = 0;
    store.subscribe(() => { calls += 1; });
    store.start();
    transport.h.onSnapshot(snap(10));
    assert.equal(store.getState().snapshot.seq, 10);
    assert.equal(store.getState().connection.phase, "live");
    assert.ok(calls >= 1);
  });

  test("a change frame updates the snapshot without a reload and yields a new state object", () => {
    const { store, transport } = makeStore();
    store.start();
    transport.h.onSnapshot(snap(10));
    const before = store.getState();
    let calls = 0;
    store.subscribe(() => { calls += 1; });
    transport.h.onChange({ seq: 11, type: "ticket", ref: "f/02-b", ticket: ticket("f/02-b", { status: "claimed", ready: false }) });
    const after = store.getState();
    assert.notEqual(after, before);
    assert.deepEqual(after.snapshot.tickets.map((t) => t.ref), ["f/01-a", "f/02-b"]);
    assert.equal(after.snapshot.seq, 11);
    assert.equal(calls, 1);
  });

  test("a change before any snapshot is ignored (no baseline)", () => {
    const { store, transport, fetches } = makeStore();
    store.start();
    transport.h.onChange({ seq: 1, type: "sessions", sessions: 5 });
    assert.equal(store.getState().snapshot, null);
    assert.equal(fetches.length, 0, "no refetch storm: the stream's own first frame is the snapshot");
  });

  test("a seq gap refetches /state and adopts the fetched snapshot", async () => {
    const { store, transport, fetches } = makeStore({ fetched: snap(50, [ticket("f/09-fresh")]) });
    store.start();
    transport.h.onSnapshot(snap(10));
    transport.h.onChange({ seq: 13, type: "sessions", sessions: 5 }); // 11 and 12 missed
    await new Promise((r) => setImmediate(r));
    assert.equal(fetches.length, 1);
    assert.equal(store.getState().snapshot.seq, 50);
    assert.deepEqual(store.getState().snapshot.tickets.map((t) => t.ref), ["f/09-fresh"]);
    // and the stream continues from the fetched seq
    transport.h.onChange({ seq: 51, type: "sessions", sessions: 7 });
    assert.equal(store.getState().snapshot.sessions, 7);
  });

  test("metrics-changed bumps metricsRevision and leaves the snapshot data", () => {
    const { store, transport } = makeStore();
    store.start();
    transport.h.onSnapshot(snap(10));
    const rev = store.getState().metricsRevision;
    transport.h.onChange({ seq: 11, type: "metrics-changed" });
    assert.equal(store.getState().metricsRevision, rev + 1);
    assert.deepEqual(store.getState().snapshot.tickets, snap(10).tickets);
  });

  test("an error keeps the last snapshot and shows reconnecting; a new snapshot recovers", () => {
    const { store, transport, clock } = makeStore();
    store.start();
    transport.h.onSnapshot(snap(10));
    clock.t = 1000;
    transport.h.onError();
    assert.equal(store.getState().snapshot.seq, 10);
    assert.equal(store.getState().connection.phase, "reconnecting");
    transport.h.onSnapshot(snap(20));
    assert.equal(store.getState().connection.phase, "live");
    assert.equal(store.getState().snapshot.seq, 20);
  });

  test("tick past 10 s of downtime goes offline, keeping the snapshot", () => {
    const { store, transport, clock } = makeStore();
    store.start();
    transport.h.onSnapshot(snap(10));
    clock.t = 1000;
    transport.h.onError();
    clock.t = 1000 + OFFLINE_AFTER_MS + 1;
    store.tick();
    assert.equal(store.getState().connection.phase, "offline");
    assert.equal(store.getState().snapshot.seq, 10);
  });

  test("unsubscribe stops notifications; close closes the transport", () => {
    const { store, transport } = makeStore();
    let calls = 0;
    const off = store.subscribe(() => { calls += 1; });
    store.start();
    off();
    transport.h.onSnapshot(snap(10));
    assert.equal(calls, 0);
    store.close();
    assert.equal(transport.closed, 1);
  });
});

// ---- real bridge over HTTP SSE ------------------------------------------------------------

// Minimal Node stand-in for the browser's EventSource: parses SSE frames off http.get and
// feeds the store's handlers. Not the code under test; the browser adapter is thin JSX.
function httpConnect(baseUrl) {
  return (h) => {
    const req = http.get(`${baseUrl}/events`, { headers: { Accept: "text/event-stream" } }, (res) => {
      h.onOpen?.();
      let buf = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        buf += chunk;
        let i;
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const raw = buf.slice(0, i);
          buf = buf.slice(i + 2);
          let event = "message";
          const data = [];
          for (const line of raw.split("\n")) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
          }
          if (!data.length) continue;
          const payload = JSON.parse(data.join("\n"));
          if (event === "snapshot") h.onSnapshot(payload);
          else if (event === "change") h.onChange(payload);
        }
      });
    });
    req.on("error", () => h.onError?.());
    return { close: () => req.destroy() };
  };
}

function until(store, pred, ms = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { off(); reject(new Error("store never reached the expected state")); }, ms);
    const check = () => { if (pred(store.getState())) { clearTimeout(timer); off(); resolve(store.getState()); } };
    const off = store.subscribe(check);
    check();
  });
}

describe("createLiveStore against a real bridge", () => {
  test("loads the snapshot, then a board edit re-renders the state within the bridge's 2 s window", async () => {
    const fx = await makeStateFixture();
    const bridge = await startBridge({ root: fx.root, port: 0 });
    const store = createLiveStore({
      connect: httpConnect(bridge.url),
      fetchState: async () => (await fetch(`${bridge.url}/state`)).json(),
      now: () => Date.now(),
    });
    try {
      store.start();
      const first = await until(store, (s) => s.snapshot !== null);
      assert.equal(first.connection.phase, "live");
      const ref = `${FEATURE}/08-plain`;
      assert.equal(first.snapshot.tickets.find((t) => t.ref === ref).status, "ready-for-agent");

      const file = path.join(fx.root, ".scratch", FEATURE, "issues", "08-plain.md");
      const text = await readFile(file, "utf8");
      await writeFile(file, text.replace("**Status:** ready-for-agent", "**Status:** blocked"));

      const after = await until(store, (s) => s.snapshot.tickets.find((t) => t.ref === ref)?.status === "blocked", 3000);
      assert.equal(after.snapshot.tickets.find((t) => t.ref === ref).ready, false);
    } finally {
      store.close();
      await bridge.close();
      await fx.cleanup();
    }
  });
});
