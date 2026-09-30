// organism-infra/71: developer-owned tests for what the qa specify files leave open: the shadow order row
// (actual beside would-have-used), the priority fills bar line, the priority/scope input allowlist and the CLI.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { decide, orderRow } from "./jev.mjs";
import { buildReport, formatReport } from "./jev-report.mjs";

const NOW = new Date("2026-09-30T10:00:00Z");
const t = (key, priority, unblockCount, scope, ticketNumber) => ({ key, priority, unblockCount, scope, ticketNumber });

test("orderRow logs the actual order beside the order rankFrontier would have used", () => {
  const tickets = [t("f/03", 2, 0, "small", 3), t("f/01", 2, 0, "large", 1), t("f/02", 1, 0, null, 2)];
  const row = orderRow({ tickets, actual: ["f/02", "f/01", "f/03"], now: NOW });
  assert.equal(row.kind, "jev-order");
  assert.equal(row.ts, NOW.toISOString());
  assert.deepEqual(row.actual, ["f/02", "f/01", "f/03"]);
  assert.deepEqual(row.wouldHave, ["f/02", "f/03", "f/01"]);
  assert.equal(row.same, false);
});

test("orderRow defaults the actual order to code order: P-level, then ticket number", () => {
  const tickets = [t("f/03", 2, 4, "small", 3), t("f/01", 2, 0, "large", 1), t("f/02", 3, 9, "small", 2)];
  const row = orderRow({ tickets, now: NOW });
  assert.deepEqual(row.actual, ["f/01", "f/03", "f/02"]);
  assert.deepEqual(row.wouldHave, ["f/03", "f/01", "f/02"]);
});

test("orderRow marks same when the combined order changes nothing", () => {
  const tickets = [t("f/01", 0, 0, "small", 1), t("f/02", 1, 0, "large", 2)];
  assert.equal(orderRow({ tickets, now: NOW }).same, true);
});

test("priority fills bar is a pass/fail line and fails with no fills (out of v1)", () => {
  const out = formatReport(buildReport([], []));
  assert.match(out, /^priority fills: FAIL \(0 verdicts of 20/m);
});

test("priority fills bar passes at 20 fill verdicts with at least 80% accepted", () => {
  const rows = Array.from({ length: 20 }, (_, i) => ({ kind: "jev-priority-fill-verdict", ticket: `f/${i}`, accept: i >= 4 }));
  const p = buildReport(rows, []).priority;
  assert.equal(p.checks.fills, true);
  rows[4].accept = false;
  assert.equal(buildReport(rows, []).priority.checks.fills, false);
});

test("priority and scope send only the ticket text (security review 67)", async () => {
  const ticketText = "# 71\n\n**Priority:** P2\n\nbody\n";
  for (const point of ["priority", "scope"]) {
    const calls = [];
    await decide({
      point, ticket: "f/71", ticketText, now: NOW, env: { TYPESAFE_API_KEY: "k" },
      testsText: "SENTINEL-TESTS", bounceComment: "SENTINEL-BOUNCE", newComment: "SENTINEL-COMMENT",
      transport: async (req) => { calls.push(req); return { pick: "ok", probs: { ok: 0.9 }, usage: { cost: 0 } }; },
    });
    assert.equal(calls.length, 1, point);
    assert.equal(calls[0].text, ticketText, point);
  }
});

test("CLI accepts priority and scope as points", () => {
  const script = fileURLToPath(new URL("./jev.mjs", import.meta.url));
  for (const point of ["priority", "scope"]) {
    const r = spawnSync(process.execPath, [script, point], { encoding: "utf8" });
    assert.equal(r.status, 2);
    assert.match(r.stderr, /--ticket is required/, point);
  }
});
