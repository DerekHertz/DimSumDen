// organism-infra/119 AC5: log-cell.mjs --context <n> stores the cell's final self-reading on the cell row,
// and the metrics CLI (the retro's numbers) reports partial returns and median final cell context.
//
// Pinned contract:
//   log-cell --context <n>   n is a non-negative integer; the row gets `context: <n>` (a number);
//                            without the flag the row has no `context` key; a bad value exits 1, writes nothing,
//                            and the message names --context.
//   node scripts/metrics.mjs (text mode) prints, for kind:"cell" rows:
//       Partial returns: <count of cell rows whose outcome starts with "partial", case-insensitive>
//       Median final cell context: <median of the numeric `context` values, rounded to an integer>
//   cell rows with no numeric `context` are left out of the median. `--json` output is not changed here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { makeBoardFixture, REPO_ROOT } from "../apps/organism-infra/board-fixture.mjs";

const LOG_CELL = path.join(REPO_ROOT, "scripts", "log-cell.mjs");
const METRICS = path.join(REPO_ROOT, "scripts", "metrics.mjs");

const rows = (root) =>
  readFileSync(path.join(root, ".scratch", "usage.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const logCell = (fx, extra) =>
  spawnSync(
    process.execPath,
    [LOG_CELL, "--ticket", fx.ticketRelPath, "--cell", "developer", "--tokens", "10", "--ms", "20", "--outcome", "ok", "--allow-no-handoff", "test setup", ...extra],
    { cwd: fx.root, env: { ...process.env, ORGANISM_ROOT: fx.root }, encoding: "utf8", timeout: 15000 },
  );

test("log-cell --context stores the reading as a number on the cell row", async () => {
  const fx = await makeBoardFixture();
  try {
    const r = logCell(fx, ["--context", "64500"]);
    assert.equal(r.status, 0, r.stderr);
    const row = rows(fx.root).find((x) => x.kind === "cell");
    assert.strictEqual(row.context, 64500);
  } finally {
    await fx.cleanup();
  }
});

test("log-cell without --context omits the context key", async () => {
  const fx = await makeBoardFixture();
  try {
    assert.equal(logCell(fx, []).status, 0);
    assert.ok(!("context" in rows(fx.root).find((x) => x.kind === "cell")));
  } finally {
    await fx.cleanup();
  }
});

for (const [name, val] of [["non-numeric", "lots"], ["negative", "-5"], ["fractional", "1.5"], ["empty", ""]]) {
  test(`log-cell rejects ${name} --context without writing`, async () => {
    const fx = await makeBoardFixture();
    try {
      const r = logCell(fx, ["--context", val]);
      assert.equal(r.status, 1);
      assert.match(r.stderr, /--context/);
      assert.doesNotMatch(r.stderr, /unrecognized/, "the flag must be known and its value validated");
      assert.throws(() => rows(fx.root));
    } finally {
      await fx.cleanup();
    }
  });
}

// --- the retro's numbers ---

const cellRow = (ticket, outcome, context) => ({ kind: "cell", ticket, cell: "developer", tokens: 1000, ms: 1000, outcome, ...(context === undefined ? {} : { context }) });

function metricsText(usageRows) {
  const root = mkdtempSync(path.join(tmpdir(), "ctx-metrics-"));
  mkdirSync(path.join(root, ".scratch"));
  writeFileSync(path.join(root, ".scratch", "usage.jsonl"), usageRows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  writeFileSync(path.join(root, ".scratch", "events.jsonl"), "");
  return spawnSync(process.execPath, [METRICS], { cwd: root, env: { ...process.env, ORGANISM_ROOT: root }, encoding: "utf8", timeout: 15000 });
}

test("metrics reports the partial-return count and the median final cell context", () => {
  const r = metricsText([
    cellRow("f/01", "done", 30000),
    cellRow("f/02", "partial: ran out of budget", 40000),
    cellRow("f/03", "Partial", 50000), // case-insensitive
    cellRow("f/04", "done", 70000),
    cellRow("f/05", "done"), // no reading: not part of the median
    { kind: "incident", ts: "2026-10-02T00:00:00Z", ticket: "f/01", cell: "developer", tool: "git", what: "x", outcome: "partial" }, // not a cell row
  ]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Partial returns: 2\b/);
  assert.match(r.stdout, /Median final cell context: 45000\b/); // even count: mean of 40000 and 50000
});

test("metrics median of an odd count is the middle reading", () => {
  const r = metricsText([cellRow("f/01", "done", 90000), cellRow("f/02", "done", 20000), cellRow("f/03", "done", 60000)]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Median final cell context: 60000\b/);
  assert.match(r.stdout, /Partial returns: 0\b/);
});

test("metrics with no context readings still runs and prints no NaN", () => {
  const r = metricsText([cellRow("f/01", "done"), cellRow("f/02", "partial")]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Partial returns: 1\b/);
  assert.doesNotMatch(r.stdout, /NaN|undefined/);
});
