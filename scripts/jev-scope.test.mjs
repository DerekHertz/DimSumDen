// organism-infra/71: jev.mjs `scope` point and `rankFrontier` ordering function (ADR 0015 decision 4).
// Scope labels: small | medium | large | other. Shadow mode only (not yet live).
// Combined frontier order (code, not Jev): P-level ASC, unblockCount DESC, scopeRank ASC, ticketNumber ASC.
// Scope never crosses a P-level: all P0 before P1, etc.
//
// Pinned contract for `decide({point:"scope", ...})`:
//   Labels: ["small", "medium", "large", "other"].
//   row.point = "scope", kind "jev", shadow: actual "orchestrator".
//   Any model output outside the set → "other" (not a fallback).
//   Standard fallbacks apply (no-key, blocked-input, http, cap).
//   Scope has no dedicated reservation; draws from shared $0.35.
//
// Pinned contract for exported `rankFrontier(tickets)`:
//   tickets: Array<{key: string, priority: 0|1|2|3, unblockCount: number, scope: string|null, ticketNumber: number}>
//   Returns a copy of the array sorted by: priority ASC, unblockCount DESC, scopeRank(scope) ASC, ticketNumber ASC.
//   scopeRank: small=0, medium=1, large=2, null|"other"=3.
//   Priority is the tie-breaker that must never be violated: a P0 ticket always comes before any P1+.
//   scope: null or "other" ranks after "large" within the same P-level and unblockCount bucket.
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
function ticket(key, priority, unblockCount, scope, ticketNumber) {
  return { key, priority, unblockCount, scope, ticketNumber };
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

// ---- Criterion 2: rankFrontier ordering function ----

test("rankFrontier: P-level is the primary sort key; P0 always before P1, P2, P3", async () => {
  const { rankFrontier } = await load();
  const input = [
    ticket("feat/02", 2, 0, "small", 2),
    ticket("feat/03", 3, 0, "small", 3),
    ticket("feat/01", 0, 0, "large", 1),
    ticket("feat/00", 1, 0, "small", 0),
  ];
  const sorted = rankFrontier(input);
  assert.equal(sorted[0].key, "feat/01"); // P0
  assert.equal(sorted[1].key, "feat/00"); // P1
  assert.equal(sorted[2].key, "feat/02"); // P2
  assert.equal(sorted[3].key, "feat/03"); // P3
});

test("rankFrontier: within the same P-level, higher unblockCount comes first", async () => {
  const { rankFrontier } = await load();
  const input = [
    ticket("feat/01", 2, 1, "small", 1),
    ticket("feat/02", 2, 5, "large", 2),
    ticket("feat/03", 2, 3, "medium", 3),
  ];
  const sorted = rankFrontier(input);
  assert.equal(sorted[0].key, "feat/02"); // unblockCount 5
  assert.equal(sorted[1].key, "feat/03"); // unblockCount 3
  assert.equal(sorted[2].key, "feat/01"); // unblockCount 1
});

test("rankFrontier: scope sorts within same P-level and unblockCount; small before medium before large", async () => {
  const { rankFrontier } = await load();
  const input = [
    ticket("feat/03", 2, 0, "large", 3),
    ticket("feat/01", 2, 0, "small", 1),
    ticket("feat/02", 2, 0, "medium", 2),
  ];
  const sorted = rankFrontier(input);
  assert.equal(sorted[0].key, "feat/01"); // small
  assert.equal(sorted[1].key, "feat/02"); // medium
  assert.equal(sorted[2].key, "feat/03"); // large
});

test("rankFrontier: scope=other and scope=null rank after large within the same bucket", async () => {
  const { rankFrontier } = await load();
  const input = [
    ticket("feat/02", 2, 0, "other", 2),
    ticket("feat/03", 2, 0, null, 3),
    ticket("feat/01", 2, 0, "large", 1),
  ];
  const sorted = rankFrontier(input);
  assert.equal(sorted[0].key, "feat/01"); // large comes before other/null
  // other and null both rank after large; relative order between them is tie-broken by ticketNumber
  const lastTwo = new Set([sorted[1].key, sorted[2].key]);
  assert.ok(lastTwo.has("feat/02"));
  assert.ok(lastTwo.has("feat/03"));
});

test("rankFrontier: within the same P-level, unblockCount, and scope, lower ticketNumber (older) first", async () => {
  const { rankFrontier } = await load();
  const input = [
    ticket("feat/10", 2, 2, "medium", 10),
    ticket("feat/04", 2, 2, "medium", 4),
    ticket("feat/07", 2, 2, "medium", 7),
  ];
  const sorted = rankFrontier(input);
  assert.equal(sorted[0].key, "feat/04");
  assert.equal(sorted[1].key, "feat/07");
  assert.equal(sorted[2].key, "feat/10");
});

test("rankFrontier: scope never causes a ticket to cross a P-level", async () => {
  const { rankFrontier } = await load();
  // P1 ticket with scope=small and P0 ticket with scope=large: P0 must still win
  const input = [
    ticket("feat/02", 1, 99, "small", 2), // P1, many unblocks, small scope
    ticket("feat/01", 0, 0, "large", 1),  // P0, no unblocks, large scope
  ];
  const sorted = rankFrontier(input);
  assert.equal(sorted[0].key, "feat/01"); // P0 always first
  assert.equal(sorted[1].key, "feat/02"); // P1 always second
});

test("rankFrontier: does not mutate the input array", async () => {
  const { rankFrontier } = await load();
  const input = [
    ticket("feat/02", 2, 0, "large", 2),
    ticket("feat/01", 2, 0, "small", 1),
  ];
  const original = [...input];
  rankFrontier(input);
  assert.equal(input[0].key, original[0].key);
  assert.equal(input[1].key, original[1].key);
});
