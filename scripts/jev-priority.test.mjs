// organism-infra/71: jev.mjs `priority` point (ADR 0015 decision 4, shadow).
// Flags mismatches when an explicit **Priority:** Px line exists and content disagrees.
// No fill in v1: if no explicit line, no transport call, fallback "no-line".
//
// Pinned contract:
//   decide({point:"priority", ticketText, ...}) checks for an explicit **Priority:** P[0-3] line.
//   No explicit line → no transport call, row.fallback = "no-line", cost 0.
//   Explicit line present → transport called, pick is the raw model label.
//   Labels: ["mismatch", "ok", "other"].
//     mismatch: content disagrees with the explicit priority line (flag emitted)
//     ok: content agrees with the explicit priority line
//     other: unclear
//   Any output outside the label set → "other" (same as route, not a fallback).
//   row: kind "jev", point "priority", pick = label, fallback null on success.
//   Shadow: result.effective = "orchestrator" (explicit line still orders the frontier; Jev only flags).
//   Live mode: result.effective = pick when pick is non-other and non-fallback, else "orchestrator".
//   Priority has no dedicated reservation (uses shared $0.35); blocked when shared exhausted.
//   Blocked input and other standard fallbacks (no-key, http, timeout) apply.
import { test } from "node:test";
import assert from "node:assert/strict";

const load = () => import("./jev.mjs");
const NOW = new Date("2026-09-30T10:00:00Z");
const TICKET = "organism-infra/71-thing";
const KEY = "sk-" + "test-KEYVALUE-should-never-leak-999";
const DAY = "2026-09-30T00:10:00Z";

const ans = (pick, cost = 0.0003) => ({ pick, probs: { [pick]: 0.88, other: 0.12 }, usage: { cost } });
function fake(answer, calls = []) {
  return async (req) => { calls.push(req); return answer; };
}
function jrow(point, cost, ts = DAY) {
  return { kind: "jev", ts, point, cost };
}

const WITH_LINE = "# 71\n\n**Priority:** P2\n\n**What to build:** a standard feature.\n";
const WITHOUT_LINE = "# 71\n\n**What to build:** a standard feature.\n";
const CLEARLY_HIGH = "# 71\n\n**Priority:** P3\n\n**URGENT blocking outage**, all hands.\n";

function args(over = {}) {
  return {
    point: "priority",
    ticket: TICKET,
    ticketText: WITH_LINE,
    now: NOW,
    usageRows: [],
    env: { TYPESAFE_API_KEY: KEY },
    ...over,
  };
}

// ---- Criterion 1: no explicit line → no call ----

test("priority: no **Priority:** line → no transport call, fallback no-line, cost 0", async () => {
  const { decide } = await load();
  const calls = [];
  const { row } = await decide(args({ ticketText: WITHOUT_LINE, transport: fake(ans("ok"), calls) }));
  assert.equal(calls.length, 0);
  assert.equal(row.fallback, "no-line");
  assert.equal(row.cost, 0);
  assert.equal(row.pick, null);
  assert.equal(row.point, "priority");
});

test("priority: **Priority:** P0–P3 triggers a transport call", async () => {
  const { decide } = await load();
  for (const px of ["P0", "P1", "P2", "P3"]) {
    const calls = [];
    const text = `# 71\n\n**Priority:** ${px}\n\n**What to build:** a thing.\n`;
    const { row } = await decide(args({ ticketText: text, transport: fake(ans("ok"), calls) }));
    assert.equal(calls.length, 1, `expected call for ${px}`);
    assert.equal(row.fallback, null, `expected no fallback for ${px}`);
  }
});

// ---- Criterion 1: mismatch flag is emitted, ok is recorded ----

test("priority: model pick mismatch → row.pick mismatch, no fallback", async () => {
  const { decide } = await load();
  const { row } = await decide(args({ ticketText: CLEARLY_HIGH, transport: fake(ans("mismatch")) }));
  assert.equal(row.pick, "mismatch");
  assert.equal(row.fallback, null);
  assert.equal(row.kind, "jev");
  assert.equal(row.point, "priority");
});

test("priority: model pick ok → row.pick ok, no fallback", async () => {
  const { decide } = await load();
  const { row } = await decide(args({ transport: fake(ans("ok")) }));
  assert.equal(row.pick, "ok");
  assert.equal(row.fallback, null);
});

test("priority: model pick other → row.pick other, no fallback (other is not a fallback)", async () => {
  const { decide } = await load();
  const { row } = await decide(args({ transport: fake(ans("other")) }));
  assert.equal(row.pick, "other");
  assert.equal(row.fallback, null);
});

// ---- Criterion 1: any output outside the label set maps to other, not fallback ----

test("priority: output outside label set maps to other, not a fallback", async () => {
  const { decide } = await load();
  for (const pick of ["standard", "hard", "banana", "", undefined, 7]) {
    const { row } = await decide(args({ transport: fake({ pick, probs: {}, usage: { cost: 0 } }) }));
    assert.equal(row.pick, "other", `pick ${String(pick)}`);
    assert.equal(row.fallback, null, `pick ${String(pick)}`);
  }
});

// ---- Criterion 1: explicit line still orders the frontier (shadow, orchestrator decides) ----

test("priority: shadow result.effective = orchestrator (explicit line still orders; Jev only flags)", async () => {
  const { decide } = await load();
  const { result, row } = await decide(args({ transport: fake(ans("mismatch")) }));
  assert.equal(result.effective, "orchestrator");
  assert.equal(result.applied, false);
  // pick must not leak in shadow result
  assert.ok(!JSON.stringify(result).includes("mismatch") || result.pick === undefined);
  assert.equal(row.actual, "orchestrator");
  assert.equal(row.mode, "shadow");
});

// ---- Standard fallbacks ----

test("priority: no-key fallback, no transport call", async () => {
  const { decide } = await load();
  const calls = [];
  const { row } = await decide(args({ env: {}, transport: fake(ans("ok"), calls) }));
  assert.equal(calls.length, 0);
  assert.equal(row.fallback, "no-key");
  assert.equal(row.cost, 0);
});

test("priority: blocked-input fallback on secret in ticket text, no call", async () => {
  const { decide } = await load();
  const calls = [];
  const secretText = WITH_LINE + "\n-----BEGIN RSA " + "PRIVATE KEY-----\nabc";
  const { row } = await decide(args({ ticketText: secretText, transport: fake(ans("ok"), calls) }));
  assert.equal(calls.length, 0);
  assert.equal(row.fallback, "blocked-input");
  assert.equal(row.cost, 0);
});

test("priority: http error → fallback http, cost 0", async () => {
  const { decide } = await load();
  const boom = async () => { throw Object.assign(new Error("HTTP 503"), { status: 503 }); };
  const { row } = await decide(args({ transport: boom }));
  assert.equal(row.fallback, "http");
  assert.equal(row.cost, 0);
});

// ---- Budget: no dedicated reservation for priority ----

test("priority: total cap blocks every point including priority", async () => {
  const { decide } = await load();
  const calls = [];
  const usageRows = [jrow("priority", 0.3), jrow("wake", 0.21)]; // total 0.51 > 0.50
  const { row } = await decide(args({ usageRows, transport: fake(ans("ok"), calls) }));
  assert.equal(calls.length, 0);
  assert.equal(row.fallback, "cap");
  assert.equal(row.cost, 0);
});

test("priority: shared remainder exhausted by other points blocks priority", async () => {
  const { decide } = await load();
  const calls = [];
  // tier 0.05 (own reserve) + 0.35 shared overflow = 0.40; total 0.40 < 0.50 but shared exhausted
  const usageRows = [jrow("tier", 0.40)];
  const { row } = await decide(args({ usageRows, transport: fake(ans("ok"), calls) }));
  assert.equal(calls.length, 0);
  assert.equal(row.fallback, "cap");
});

test("priority: draws fine when shared remainder has room", async () => {
  const { decide } = await load();
  const calls = [];
  // tier spent its 0.05 reserve; scope spent 0.10 shared; total 0.15, shared 0.10 < 0.35
  const usageRows = [jrow("tier", 0.05), jrow("scope", 0.10)];
  const { row } = await decide(args({ usageRows, transport: fake(ans("ok"), calls) }));
  assert.equal(calls.length, 1);
  assert.equal(row.fallback, null);
});
