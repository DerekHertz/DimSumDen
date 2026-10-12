// organism-infra/71: jev.mjs `scope` point (ADR 0015 decision 4). queue/06 retired the frontier ordering function.
// Scope labels: small | medium | large | other. Shadow mode only (not yet live).
//
// Pinned contract for `decide({point:"scope", ...})`:
//   Labels: ["small", "medium", "large", "other"].
//   row.point = "scope", kind "jev", shadow: actual "orchestrator".
//   Any model output outside the set → "other" (not a fallback).
//   Standard fallbacks apply (no-key, blocked-input, http, cap).
//   Scope has no dedicated reservation; draws from shared $0.35.
//
import { test } from "node:test";
import assert from "node:assert/strict";

const load = () => import("./jev.mjs");
const NOW = new Date("2026-09-30T10:00:00Z");
const TICKET = "organism-infra/71-thing";
const KEY = "sk-" + "test-KEYVALUE-should-never-leak-999";
const DAY = "2026-09-30T00:10:00Z";

const ans = (pick, cost = 0.0003) => ({ pick, probs: { [pick]: 0.9, other: 0.1 }, usage: { cost } });
function fake(answer, calls = []) {
  return async (req) => { calls.push(req); return answer; };
}
function jrow(point, cost, ts = DAY) {
  return { kind: "jev", ts, point, cost };
}
function args(over = {}) {
  return {
    point: "scope",
    ticket: TICKET,
    ticketText: "# 71\n\n**What to build:** a medium-sized change across three modules.\n",
    now: NOW,
    usageRows: [],
    env: { TYPESAFE_API_KEY: KEY },
    ...over,
  };
}

// ---- Criterion 2: scope point basics ----

test("scope: returns one of small|medium|large|other", async () => {
  const { decide } = await load();
  for (const label of ["small", "medium", "large", "other"]) {
    const { row } = await decide(args({ transport: fake(ans(label)) }));
    assert.equal(row.pick, label, `expected pick ${label}`);
    assert.equal(row.fallback, null);
    assert.equal(row.kind, "jev");
    assert.equal(row.point, "scope");
  }
});

test("scope: any output outside the label set maps to other, not a fallback", async () => {
  const { decide } = await load();
  for (const pick of ["standard", "hard", "mismatch", "banana", "", undefined, 7]) {
    const { row } = await decide(args({ transport: fake({ pick, probs: {}, usage: { cost: 0 } }) }));
    assert.equal(row.pick, "other", `pick ${String(pick)}`);
    assert.equal(row.fallback, null);
  }
});

test("scope: shadow result.effective = orchestrator (scope is shadow; orchestrator still orders)", async () => {
  const { decide } = await load();
  const { result, row } = await decide(args({ transport: fake(ans("small")) }));
  assert.equal(result.effective, "orchestrator");
  assert.equal(result.applied, false);
  assert.equal(row.actual, "orchestrator");
  assert.equal(row.mode, "shadow");
});

test("scope: row carries the model pick in shadow mode (logged for later analysis)", async () => {
  const { decide } = await load();
  const { row } = await decide(args({ transport: fake(ans("large")) }));
  assert.equal(row.pick, "large");
  assert.equal(row.mode, "shadow");
});

// ---- Standard fallbacks ----

test("scope: no-key fallback, no transport call", async () => {
  const { decide } = await load();
  const calls = [];
  const { row } = await decide(args({ env: {}, transport: fake(ans("small"), calls) }));
  assert.equal(calls.length, 0);
  assert.equal(row.fallback, "no-key");
});

test("scope: blocked-input fallback on secret in ticket text", async () => {
  const { decide } = await load();
  const calls = [];
  const secretText = "# 71\n\n**Priority:** P2\n\n-----BEGIN RSA " + "PRIVATE KEY-----\nabc";
  const { row } = await decide(args({ ticketText: secretText, transport: fake(ans("small"), calls) }));
  assert.equal(calls.length, 0);
  assert.equal(row.fallback, "blocked-input");
});

// ---- Budget: no dedicated reservation for scope ----

test("scope: total cap blocks scope too", async () => {
  const { decide } = await load();
  const calls = [];
  const usageRows = [jrow("scope", 0.3), jrow("wake", 0.21)]; // > 0.50
  const { row } = await decide(args({ usageRows, transport: fake(ans("small"), calls) }));
  assert.equal(calls.length, 0);
  assert.equal(row.fallback, "cap");
});

test("scope: shared remainder exhausted blocks scope", async () => {
  const { decide } = await load();
  const calls = [];
  const usageRows = [jrow("tier", 0.40)]; // 0.05 reserve + 0.35 shared overflow = exhausted
  const { row } = await decide(args({ usageRows, transport: fake(ans("small"), calls) }));
  assert.equal(calls.length, 0);
  assert.equal(row.fallback, "cap");
});
