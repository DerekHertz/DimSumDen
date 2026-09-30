// organism-infra/79: advisory outcome rows and jev-report advisory section (ADR 0015).
//
// Pinned contract (developer implements against it):
//   Advisory outcome row (logged by the orchestrator after the user approves a dispatch):
//     kind: "jev-advisory-outcome"
//     ts:                ISO timestamp
//     ticket:            "<feature>/<NN>" (short key)
//     orchestratorPick:  the cell the orchestrator proposed (string label, e.g. "qa-specify")
//     jevPick:           the label jev.mjs route --mode advisory returned (string or null)
//     userChoice:        the label the user approved (string)
//     bounced:           boolean, true when the dispatched cell later bounced
//
//   buildReport(rows, events) includes a new report.advisory section:
//     { rows: number,
//       byLabel: { [jevPick]: { picks: number, agreed: number } },
//       agreed: number, total: number, agreementPct: number }
//   Only rows where jevPick is not null and not "other" contribute to byLabel / agreed.
//   "other" picks count toward rows but not toward agreementPct.
//
//   formatReport(report) prints one line per jevPick label seen:
//     "advisory agreement <label>: <agreed>/<picks> agreed"
//   and a summary line:
//     "advisory route (advisory-live; ADR 0015)"
//
// Scope additions (from ticket Comments, deferred from organism-infra/71 by qa verify):
//
//   [S1] orderRow wiring: jev.mjs exports orderRow; calling it and appending the resulting
//        jev-order row to usage.jsonl is a valid workflow. The wiring itself is in the
//        orchestrator genome (human-applied), so the test verifies the export shape and that
//        buildReport handles a jev-order row alongside advisory outcome rows without error.
//
//   [S2] jev-priority-verdict rows: a new CLI point "priority-verdict" (or equivalent export)
//        lets the orchestrator log a verdict row when the user rules on a priority flag.
//        CLI: node scripts/jev.mjs priority-verdict --ticket <ref> --verdict right|wrong
//        Row: { kind: "jev-priority-verdict", ts, ticket, right: boolean }
//        buildReport already reads these rows for the flags bar (jev-report.mjs line ~118).
//
// Criteria covered:
//   [2] An outcome row records orchestrator pick, Jev pick, user choice, and later bounce;
//       jev-report.mjs prints advisory agreement per label
//   [S1] orderRow wiring — export shape and integration with buildReport
//   [S2] jev-priority-verdict logging via CLI
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const SCRIPT = path.join(REPO_ROOT, "scripts", "jev.mjs");
const NOW = "2026-09-30T10:00:00Z";

const load = () => import("./jev-report.mjs");

// helper: a minimal advisory outcome row
function outcome(over = {}) {
  return {
    kind: "jev-advisory-outcome",
    ts: NOW,
    ticket: "feat/01",
    orchestratorPick: "qa-specify",
    jevPick: "qa-specify",
    userChoice: "qa-specify",
    bounced: false,
    ...over,
  };
}

// ── Criterion 2: buildReport reads jev-advisory-outcome rows ─────────────────

test("buildReport includes report.advisory with rows count from jev-advisory-outcome rows", async () => {
  const { buildReport } = await load();
  const rows = [outcome(), outcome({ ticket: "feat/02", jevPick: "architect", userChoice: "product" })];
  const report = buildReport(rows);
  assert.ok(report.advisory, "report.advisory must exist");
  assert.equal(report.advisory.rows, 2);
});

test("advisory agreement: jevPick == userChoice counts as agreed per label", async () => {
  const { buildReport } = await load();
  const rows = [
    outcome({ jevPick: "qa-specify", userChoice: "qa-specify" }),   // agreed
    outcome({ jevPick: "qa-specify", userChoice: "architect" }),     // disagreed
    outcome({ ticket: "feat/02", jevPick: "architect", userChoice: "architect" }), // agreed
  ];
  const { advisory } = buildReport(rows);
  assert.ok(advisory.byLabel["qa-specify"], "byLabel must have qa-specify");
  assert.equal(advisory.byLabel["qa-specify"].picks, 2);
  assert.equal(advisory.byLabel["qa-specify"].agreed, 1);
  assert.equal(advisory.byLabel.architect.picks, 1);
  assert.equal(advisory.byLabel.architect.agreed, 1);
  assert.equal(advisory.agreed, 2);
  assert.equal(advisory.total, 3); // total non-other picks
  assert.ok(Math.abs(advisory.agreementPct - (2 / 3) * 100) < 0.01);
});

test("advisory agreement: jevPick null or other excluded from byLabel and agreed", async () => {
  const { buildReport } = await load();
  const rows = [
    outcome({ jevPick: null, userChoice: "qa-specify" }),           // no-key fallback
    outcome({ jevPick: "other", userChoice: "architect" }),          // other excluded
    outcome({ ticket: "feat/02", jevPick: "product", userChoice: "product" }), // agreed
  ];
  const { advisory } = buildReport(rows);
  assert.equal(advisory.rows, 3);
  assert.equal(advisory.total, 1); // only the product pick counts
  assert.equal(advisory.agreed, 1);
  assert.equal(advisory.byLabel.other, undefined);
  assert.equal(advisory.byLabel.product.picks, 1);
  assert.equal(advisory.byLabel.product.agreed, 1);
});

test("advisory bounced field is stored in the row and accessible via report", async () => {
  const { buildReport } = await load();
  const rows = [
    outcome({ jevPick: "qa-specify", userChoice: "qa-specify", bounced: false }),
    outcome({ ticket: "feat/02", jevPick: "qa-specify", userChoice: "qa-specify", bounced: true }),
  ];
  const { advisory } = buildReport(rows);
  assert.equal(advisory.rows, 2);
  // Agreement still counts bounced rows (bounce is informational for the advisory report)
  assert.equal(advisory.agreed, 2);
});

test("buildReport with no advisory outcome rows still returns an advisory section with zeros", async () => {
  const { buildReport } = await load();
  const rows = [{ kind: "cell", ticket: "feat/01", cell: "developer", tokens: 100 }];
  const { advisory } = buildReport(rows);
  assert.ok(advisory, "advisory section must always exist");
  assert.equal(advisory.rows, 0);
  assert.equal(advisory.agreed, 0);
  assert.deepEqual(advisory.byLabel, {});
});

// ── Criterion 2: formatReport prints advisory agreement per label ─────────────

test("formatReport prints advisory route header and per-label agreement lines", async () => {
  const { buildReport, formatReport } = await load();
  const rows = [
    outcome({ jevPick: "qa-specify", userChoice: "qa-specify" }),
    outcome({ ticket: "feat/02", jevPick: "architect", userChoice: "product" }),
    outcome({ ticket: "feat/03", jevPick: "qa-specify", userChoice: "qa-specify" }),
  ];
  const out = formatReport(buildReport(rows));
  assert.match(out, /advisory route.*ADR 0015/i, "must print advisory route header");
  assert.match(out, /advisory agreement qa-specify: 2\/2/m, "qa-specify 2/2");
  assert.match(out, /advisory agreement architect: 0\/1/m, "architect 0/1 disagreed");
});

test("formatReport shows advisory section even with no advisory outcome rows", async () => {
  const { buildReport, formatReport } = await load();
  const out = formatReport(buildReport([]));
  // Advisory section must be present (even if empty)
  assert.match(out, /advisory route/i);
});

// ── Scope [S1]: orderRow export shape and integration with buildReport ────────

test("[S1] orderRow export exists and produces a jev-order row with kind, actual, wouldHave, same", async () => {
  const { orderRow } = await import("./jev.mjs");
  assert.ok(typeof orderRow === "function", "orderRow must be exported from jev.mjs");
  const t = (key, priority, unblockCount, scope, ticketNumber) => ({ key, priority, unblockCount, scope, ticketNumber });
  const tickets = [t("feat/02", 1, 0, "small", 2), t("feat/01", 2, 0, "large", 1)];
  const row = orderRow({ tickets, actual: ["feat/02", "feat/01"], now: new Date(NOW) });
  assert.equal(row.kind, "jev-order");
  assert.ok(Array.isArray(row.actual), "row.actual must be an array");
  assert.ok(Array.isArray(row.wouldHave), "row.wouldHave must be an array");
  assert.equal(typeof row.same, "boolean");
});

test("[S1] buildReport processes a jev-order row alongside advisory outcome rows without error", async () => {
  const { buildReport } = await load();
  const { orderRow } = await import("./jev.mjs");
  const t = (key, priority, unblockCount, scope, ticketNumber) => ({ key, priority, unblockCount, scope, ticketNumber });
  const tickets = [t("feat/01", 1, 0, "small", 1), t("feat/02", 2, 0, "medium", 2)];
  const orderRowData = orderRow({ tickets, actual: ["feat/01", "feat/02"], now: new Date(NOW) });
  const rows = [outcome(), orderRowData];
  // Must not throw; advisory section must still have 1 row
  const report = buildReport(rows);
  assert.equal(report.advisory.rows, 1);
});

// ── Scope [S2]: jev-priority-verdict rows via CLI "priority-verdict" point ────

function makeBoard(ticketText) {
  const root = mkdtempSync(path.join(tmpdir(), "jev-pverdict-cli-"));
  mkdirSync(path.join(root, ".scratch", "feat", "issues"), { recursive: true });
  writeFileSync(path.join(root, ".scratch", "feat", "issues", "01-thing.md"), ticketText);
  return root;
}
function runCli(root, argv) {
  const env = { ...process.env, ORGANISM_ROOT: root };
  delete env.TYPESAFE_API_KEY;
  return spawnSync(process.execPath, [SCRIPT, ...argv], { cwd: root, env, encoding: "utf8", timeout: 20000 });
}

test("[S2] CLI priority-verdict --ticket ... --verdict right logs a jev-priority-verdict row with right:true", () => {
  const root = makeBoard("# 01\n\n**Priority:** P2\n\n**Status:** resolved\n");
  const r = runCli(root, ["priority-verdict", "--ticket", "feat/01-thing", "--verdict", "right"]);
  assert.equal(r.status, 0, `stderr: ${r.stderr}`);
  const lines = readFileSync(path.join(root, ".scratch", "usage.jsonl"), "utf8").trim().split("\n");
  assert.ok(lines.length >= 1);
  const row = JSON.parse(lines[0]);
  assert.equal(row.kind, "jev-priority-verdict");
  assert.equal(row.right, true);
  assert.ok(typeof row.ts === "string");
  assert.ok(typeof row.ticket === "string");
});

test("[S2] CLI priority-verdict --verdict wrong logs a jev-priority-verdict row with right:false", () => {
  const root = makeBoard("# 01\n\n**Priority:** P2\n\n**Status:** resolved\n");
  const r = runCli(root, ["priority-verdict", "--ticket", "feat/01-thing", "--verdict", "wrong"]);
  assert.equal(r.status, 0, `stderr: ${r.stderr}`);
  const row = JSON.parse(
    readFileSync(path.join(root, ".scratch", "usage.jsonl"), "utf8").trim().split("\n")[0],
  );
  assert.equal(row.kind, "jev-priority-verdict");
  assert.equal(row.right, false);
});

test("[S2] buildReport reads jev-priority-verdict rows for the flags bar (existing contract)", async () => {
  const { buildReport } = await load();
  // 10 right verdicts: below FLAG_BAR.min (10) but pct is 100% (not the threshold check)
  const verdicts = Array.from({ length: 10 }, () => ({ kind: "jev-priority-verdict", ticket: "feat/01", right: true }));
  const { priority } = buildReport(verdicts);
  assert.equal(priority.flags.verdicts, 10);
  assert.equal(priority.flags.yes, 10);
  // 10 >= 10 min and 100% >= 70%: should pass
  assert.equal(priority.checks.flagging, true);
});
