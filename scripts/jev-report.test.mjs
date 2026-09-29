// organism-infra/41: scripts/jev-report.mjs, the Jev shadow report (ADR 0010, decision 10).
// Seams: exported buildReport(rows) -> report object, formatReport(report) -> string,
// and the CLI `node scripts/jev-report.mjs --usage <file> [--json]` (default file:
// <ORGANISM_ROOT or cwd>/.scratch/usage.jsonl). Fixture rows only; never the live usage.jsonl.
//
// Pinned contract (developer implements against it):
//  - Ticket key = "<feature>/<NN>" (jev rows carry the full slug, cell/resolved rows may carry only NN).
//  - A ticket is included only if it has at least one cell or resolved row.
//  - One jev row per (ticket, point): the latest by ts.
//  - Token weights (fixed before results are read): haiku 0.5, sonnet 1, opus 2 (ADR 0010).
//    Baseline = every cell row's tokens at weight 1 (genome minimums).
//    Counterfactual for `tier`: developer cell rows use weight of pick (sonnet 1, opus 2).
//    Counterfactual for `verify`: qa cell rows whose mode starts with "verify" use
//    light -> 0.5, full -> 1. pick null/other or a fallback row -> baseline (weight 1).
//  - report = { tickets: [{ticket, baseline, projected:{tier, verify, both}, bounces}] sorted by ticket,
//               points: {tier|verify: {tickets, fallbacks (excluding cap), capFired, medianMs,
//                        jevCost, baseline, projected, savedPct, bounces}} }
//  - Text output shows one exit-criteria table: coverage, safety, value, spend for each point.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const SCRIPT = path.join(REPO_ROOT, "scripts", "jev-report.mjs");

const jev = (ticket, point, pick, actual, extra = {}) => ({
  kind: "jev", ts: "2026-09-29T01:00:00Z", ticket, point, pick, actual,
  cost: 0.001, conf: 0.9, mode: "shadow", fallback: null, ms: 100, model: "jev-1.13.0", ...extra,
});
const cell = (ticket, c, mode, tokens) => ({ kind: "cell", ticket, cell: c, mode, tokens, ms: 1, outcome: "pass" });
const resolved = (ticket, bounces) => ({ kind: "resolved", ts: "2026-09-29T02:00:00Z", ticket, pr: 1, bounces });

// A f/01: tier sonnet, verify light. baseline 2200; verify-light projection 2000.
// B f/02: tier opus, verify full.    baseline 2700; tier projection 4700.
// C f/03: tier timeout fallback, verify cap fallback. baseline 1000, unchanged.
// D f/99: jev rows only (mistyped ref): excluded.
const ROWS = [
  jev("f/01-alpha", "tier", "sonnet", "sonnet", { ms: 100, cost: 0.001 }),
  jev("f/01-alpha", "verify", "light", "full", { ms: 200, cost: 0.002 }),
  cell("f/01", "qa", "specify", 500),
  cell("f/01", "developer", "implement", 1000),
  cell("f/01", "qa", "verify", 400),
  cell("f/01", "security", "full", 300),
  resolved("f/01", 0),
  jev("f/02-beta", "tier", "opus", "sonnet", { ms: 300, cost: 0.001 }),
  jev("f/02-beta", "verify", "full", "full", { ms: 400, cost: 0.002 }),
  cell("f/02", "qa", "specify", 100),
  cell("f/02", "developer", "implement", 2000),
  cell("f/02", "qa", "verify", 600),
  resolved("f/02", 2),
  jev("f/03-gamma", "tier", null, "sonnet", { ms: 50, cost: 0, conf: null, fallback: "timeout" }),
  jev("f/03-gamma", "verify", null, "full", { ms: 0, cost: 0, conf: null, fallback: "cap" }),
  cell("f/03", "developer", "implement", 800),
  cell("f/03", "qa", "verify", 200),
  resolved("f/03", 1),
  jev("f/99-typo", "tier", "opus", "sonnet"),
  jev("f/99-typo", "verify", "light", "full"),
];

const close = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} != ${b}`);

test("counterfactual projection per ticket, joined across short and full refs", async () => {
  const { buildReport } = await import("./jev-report.mjs");
  const r = buildReport(ROWS);
  const by = Object.fromEntries(r.tickets.map((t) => [t.ticket, t]));
  assert.deepEqual(Object.keys(by).sort(), ["f/01", "f/02", "f/03"]);
  assert.equal(by["f/01"].baseline, 2200);
  assert.equal(by["f/01"].projected.tier, 2200);
  assert.equal(by["f/01"].projected.verify, 2000);
  assert.equal(by["f/01"].projected.both, 2000);
  assert.equal(by["f/02"].baseline, 2700);
  assert.equal(by["f/02"].projected.tier, 4700);
  assert.equal(by["f/02"].projected.verify, 2700);
  assert.equal(by["f/02"].projected.both, 4700);
  assert.equal(by["f/03"].baseline, 1000);
  assert.equal(by["f/03"].projected.both, 1000);
  assert.equal(by["f/01"].bounces, 0);
  assert.equal(by["f/02"].bounces, 2);
  assert.equal(by["f/03"].bounces, 1);
});

test("per-point exit-criteria numbers from fixture rows", async () => {
  const { buildReport } = await import("./jev-report.mjs");
  const { points } = buildReport(ROWS);
  assert.equal(points.tier.tickets, 3);
  assert.equal(points.tier.fallbacks, 1);
  assert.equal(points.tier.capFired, 0);
  assert.equal(points.tier.medianMs, 100);
  close(points.tier.jevCost, 0.002);
  assert.equal(points.tier.baseline, 5900);
  assert.equal(points.tier.projected, 7900);
  close(points.tier.savedPct, -33.90);
  assert.equal(points.tier.bounces, 3);

  assert.equal(points.verify.tickets, 3);
  assert.equal(points.verify.fallbacks, 0); // cap does not count
  assert.equal(points.verify.capFired, 1);
  assert.equal(points.verify.medianMs, 200);
  close(points.verify.jevCost, 0.004);
  assert.equal(points.verify.baseline, 5900);
  assert.equal(points.verify.projected, 5700);
  close(points.verify.savedPct, 3.39);
  assert.equal(points.verify.bounces, 3);
});

test("jev rows for a ticket with no cell or resolved rows are excluded", async () => {
  const { buildReport } = await import("./jev-report.mjs");
  const r = buildReport(ROWS);
  assert.ok(!r.tickets.some((t) => t.ticket === "f/99"));
  assert.equal(r.points.tier.tickets, 3);
  assert.equal(r.points.verify.tickets, 3);
  close(r.points.tier.jevCost, 0.002); // the f/99 row's 0.001 is not counted
});

test("CLI prints the exit-criteria table from a fixture file", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "jev-report-"));
  const file = path.join(dir, "usage.jsonl");
  writeFileSync(file, ROWS.map((x) => JSON.stringify(x)).join("\n") + "\n");
  const res = spawnSync(process.execPath, [SCRIPT, "--usage", file], { encoding: "utf8" });
  assert.equal(res.status, 0, res.stderr);
  const out = res.stdout;
  for (const word of ["tier", "verify", "coverage", "safety", "value", "spend"]) {
    assert.ok(out.toLowerCase().includes(word), `missing ${word}`);
  }
  assert.ok(out.includes("3.4%"), "verify savings 3.4%");
  assert.ok(out.includes("-33.9%"), "tier savings -33.9%");
  for (const t of ["f/01", "f/02", "f/03"]) assert.ok(out.includes(t), t);
  assert.ok(out.includes("2200") && out.includes("2000"), "per-ticket baseline and projection");
  assert.ok(!out.includes("f/99"), "excluded ticket must not appear");
});

test("CLI --json prints the report object", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "jev-report-"));
  const file = path.join(dir, "usage.jsonl");
  writeFileSync(file, ROWS.map((x) => JSON.stringify(x)).join("\n") + "\n");
  const res = spawnSync(process.execPath, [SCRIPT, "--usage", file, "--json"], { encoding: "utf8" });
  assert.equal(res.status, 0, res.stderr);
  const r = JSON.parse(res.stdout);
  assert.equal(r.points.verify.projected, 5700);
  assert.equal(r.tickets.length, 3);
});
