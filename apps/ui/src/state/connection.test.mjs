// dimsumden-ui-v0/07: connection state behind the header pill (designer spec section 1).
// Pure state machine, time passed in by the caller (ms). Contract chosen by qa:
//   initialConnection(now) -> {phase, hasSnapshot, downSince}, phase in
//     "connecting" | "live" | "reconnecting" | "offline"
//   connectionReducer(conn, {type: "open" | "snapshot" | "error" | "tick", now}) -> conn
//   pillModel(conn) -> {label, tone: "live" | "muted" | "alarm", ariaLive: "polite" | null}
//   panelPlaceholder(conn) -> string | null
//   OFFLINE_AFTER_MS = 10000 ("bridge unreachable over 10 s")
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { OFFLINE_AFTER_MS, initialConnection, connectionReducer, pillModel, panelPlaceholder } from "./connection.mjs";

const step = (conn, type, now) => connectionReducer(conn, { type, now });

describe("connection reducer", () => {
  test("the offline threshold is 10 seconds", () => {
    assert.equal(OFFLINE_AFTER_MS, 10000);
  });

  test("starts connecting with no snapshot", () => {
    const c = initialConnection(1000);
    assert.equal(c.phase, "connecting");
    assert.equal(c.hasSnapshot, false);
  });

  test("the first snapshot makes it live", () => {
    const c = step(initialConnection(0), "snapshot", 500);
    assert.equal(c.phase, "live");
    assert.equal(c.hasSnapshot, true);
  });

  test("an open without a snapshot is not live yet (state would be stale)", () => {
    const c = step(initialConnection(0), "open", 100);
    assert.equal(c.phase, "connecting");
  });

  test("an error while live goes to reconnecting and keeps hasSnapshot", () => {
    const live = step(initialConnection(0), "snapshot", 500);
    const c = step(live, "error", 5000);
    assert.equal(c.phase, "reconnecting");
    assert.equal(c.hasSnapshot, true);
  });

  test("a fresh snapshot after reconnecting is live again", () => {
    let c = step(initialConnection(0), "snapshot", 500);
    c = step(c, "error", 5000);
    c = step(c, "snapshot", 6000);
    assert.equal(c.phase, "live");
  });

  test("still reconnecting at exactly 10 s down, offline just past it", () => {
    const c = step(step(initialConnection(0), "snapshot", 0), "error", 1000);
    assert.equal(step(c, "tick", 1000 + OFFLINE_AFTER_MS).phase, "reconnecting");
    assert.equal(step(c, "tick", 1000 + OFFLINE_AFTER_MS + 1).phase, "offline");
  });

  test("never having connected: offline once the first attempt is over 10 s old", () => {
    const c = initialConnection(0);
    assert.equal(step(c, "tick", OFFLINE_AFTER_MS).phase, "connecting");
    assert.equal(step(c, "tick", OFFLINE_AFTER_MS + 1).phase, "offline");
  });

  test("repeated errors do not restart the offline clock", () => {
    let c = step(step(initialConnection(0), "snapshot", 0), "error", 1000);
    c = step(c, "error", 6000);
    c = step(c, "error", 11500);
    assert.equal(c.phase, "offline");
  });

  test("offline recovers only on a snapshot", () => {
    const c = step(initialConnection(0), "tick", OFFLINE_AFTER_MS + 1);
    assert.equal(step(c, "open", 20000).phase, "offline");
    assert.equal(step(c, "error", 20000).phase, "offline");
    assert.equal(step(c, "snapshot", 20000).phase, "live");
  });

  test("a tick while live changes nothing", () => {
    const live = step(initialConnection(0), "snapshot", 0);
    assert.equal(step(live, "tick", 999999).phase, "live");
  });

  test("does not mutate its input", () => {
    const c = initialConnection(0);
    const copy = structuredClone(c);
    step(c, "snapshot", 5);
    assert.deepEqual(c, copy);
  });
});

describe("pill and placeholder copy (designer spec section 1)", () => {
  const live = step(initialConnection(0), "snapshot", 0);
  const reconnecting = step(live, "error", 100);
  const offline = step(reconnecting, "tick", 100 + OFFLINE_AFTER_MS + 1);

  test("live: 'Live'", () => {
    assert.equal(pillModel(live).label, "Live");
    assert.equal(pillModel(live).tone, "live");
  });

  test("connecting and reconnecting: 'Reconnecting...' muted, aria-live polite", () => {
    for (const c of [initialConnection(0), reconnecting]) {
      const p = pillModel(c);
      assert.equal(p.label, "Reconnecting...");
      assert.equal(p.tone, "muted");
      assert.equal(p.ariaLive, "polite");
    }
  });

  test("offline: alarm tone with the run hint", () => {
    const p = pillModel(offline);
    assert.equal(p.label, "Bridge offline: run npm run ui");
    assert.equal(p.tone, "alarm");
  });

  test("the panel says 'Connecting to the den...' only before the first snapshot", () => {
    assert.equal(panelPlaceholder(initialConnection(0)), "Connecting to the den...");
    assert.equal(panelPlaceholder(live), null);
    assert.equal(panelPlaceholder(reconnecting), null);
    assert.equal(panelPlaceholder(offline), null, "stale data stays on screen once we have had a snapshot");
  });
});
