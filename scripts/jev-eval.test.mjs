// den-mvp/40: the Jev eval harness, with a fake transport. No test calls the network or reads a key.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseCases, renderReport, runEval, score, verdict } from "./jev-eval.mjs";
import { areasOf, triageState } from "./jev.mjs";

const KEY = "fake-key";
const caseOf = (id, label, text = `job: test\nfailing tests: ${id}`) => ({ id, label, text });
// A fake that answers from a table: id -> [pick, conf], tokens and cost fixed per call.
const fake = (table, calls = []) => async (req) => {
  calls.push(req);
  const id = req.text.match(/failing tests: (\S+)/)[1];
  const [pick, conf] = table[id];
  return { pick, probs: { [pick]: conf }, usage: { tokens: 1000, cost: 1000 * 0.042e-6 } };
};
let t = 0;
const clock = () => (t += 100);

test("a run scores accuracy, the confusion matrix and the confidence buckets", async () => {
  const cases = [caseOf("a", "flake"), caseOf("b", "code"), caseOf("c", "env"), caseOf("d", "code")];
  const results = await runEval({ usecase: "triage", cases, model: "jev-1.13.0", apiKey: KEY, clock,
    transport: fake({ a: ["flake", 0.95], b: ["code", 0.85], c: ["code", 0.55], d: ["code", 0.92] }) });
  const s = score("triage", results);
  assert.equal(s.answered, 4);
  assert.equal(s.right, 3);
  assert.equal(s.accuracy, 0.75);
  assert.equal(s.confusion.env.code, 1);
  assert.equal(s.confusion.code.code, 2);
  const hi = s.buckets.find((b) => b.lo === 0.9);
  assert.deepEqual([hi.n, hi.right], [2, 2]);
  const mid = s.buckets.find((b) => b.lo === 0.5);
  assert.deepEqual([mid.n, mid.right], [1, 0]);
  assert.equal(s.tokens, 4000);
  assert.ok(Math.abs(s.costPerCase - 0.000042) < 1e-12);
  assert.equal(s.p50ms, 100);
});

test("a code failure called a flake is a safety miss, and the report names the lowest floor that clears it", async () => {
  const cases = [caseOf("a", "code"), caseOf("b", "code"), caseOf("c", "flake"), caseOf("d", "env")];
  const results = await runEval({ usecase: "triage", cases, model: "jev-1.14.0", apiKey: KEY, clock,
    transport: fake({ a: ["flake", 0.72], b: ["code", 0.9], c: ["code", 0.6], d: ["flake", 0.99] }) });
  const s = score("triage", results);
  assert.deepEqual(s.misses, [{ id: "a", conf: 0.72 }]);
  // env called flake is wrong but not the safety miss; a flake called code is the safe side.
  assert.equal(s.floors.find((f) => f.floor === 0.7).misses, 1);
  assert.equal(s.floors.find((f) => f.floor === 0.8).misses, 0);
  assert.equal(s.safeFloor, 0.8);
  const v = verdict("triage", s);
  assert.equal(v.checks.find((c) => c[0] === "safety")[1], true);
  assert.equal(v.pass, false, "25% accuracy fails the bar");
});

test("a case that trips the secret check is skipped and listed, and never reaches the transport", async () => {
  const calls = [];
  const secret = "AKIA" + "ABCDEFGHIJKLMNOP";
  const cases = [caseOf("a", "flake"), { id: "leak", label: "code", text: `job: security\nfailing tests: leak\nkey ${secret}` }];
  const results = await runEval({ usecase: "triage", cases, model: "jev-1.13.0", apiKey: KEY, clock, transport: fake({ a: ["flake", 0.9] }, calls) });
  assert.equal(calls.length, 1);
  assert.ok(!calls.some((c) => c.text.includes(secret)));
  const s = score("triage", results);
  assert.deepEqual(s.skipped, [{ id: "leak", why: "blocked-input" }]);
  assert.equal(s.answered, 1);
  assert.match(renderReport({ usecase: "triage", model: "jev-1.13.0", date: "2026-10-15", s, results }), /## Skipped\n\n- leak: blocked-input/);
});

test("the transport gets the triage point, the model and the key; an error or an unknown pick is listed, not scored", async () => {
  const calls = [];
  const transport = async (req) => {
    calls.push(req);
    if (req.text.includes("boom")) { const e = new Error("HTTP 500"); e.status = 500; throw e; }
    return { pick: "maybe", probs: { maybe: 1 }, usage: {} };
  };
  const results = await runEval({ usecase: "triage", cases: [caseOf("boom", "env"), caseOf("odd", "code")], model: "jev-1.14.0", apiKey: KEY, clock, transport });
  assert.deepEqual(calls.map((c) => [c.point, c.model, c.apiKey]), [["triage", "jev-1.14.0", KEY], ["triage", "jev-1.14.0", KEY]]);
  const s = score("triage", results);
  assert.deepEqual(s.errors, [{ id: "boom", why: "http 500" }, { id: "odd", why: "unparseable" }]);
  assert.equal(s.answered, 0);
  assert.equal(verdict("triage", s).pass, false);
});

test("the bar passes only on accuracy, a safe floor, cost and p95 together", () => {
  const s = { accuracy: 0.9, safeFloor: 0, costPerCase: 0.0002, p95ms: 900 };
  assert.equal(verdict("triage", s).pass, true);
  assert.equal(verdict("triage", { ...s, p95ms: 3000 }).pass, false);
  assert.equal(verdict("triage", { ...s, costPerCase: 0.001 }).pass, false);
  assert.equal(verdict("triage", { ...s, safeFloor: null }).pass, false);
  assert.equal(verdict("triage", { ...s, accuracy: 0.84 }).pass, false);
});

test("cases parse from JSONL and a line without id, text or label is refused", () => {
  assert.deepEqual(parseCases('{"id":"a","text":"t","label":"code","evidence":"x"}\n\n').map((c) => c.id), ["a"]);
  assert.throws(() => parseCases('{"id":"a","label":"code"}'), /line 1/);
});

test("triageState: a header with the job and every failing test, then each failing test's lines; no runner prefixes or colour codes", () => {
  const log = [
    "test\tRun\t2026-10-01T00:00:00.0000000Z ok 1 - fine",
    "test\tRun\t2026-10-01T00:00:01.0000000Z not ok 2 - first thing",
    "test\tRun\t2026-10-01T00:00:01.0000000Z   error: 'boom \u001b[31mred\u001b[0m'",
    "test\tRun\t2026-10-01T00:00:02.0000000Z not ok 3 - second thing",
    "test\tRun\t2026-10-01T00:00:02.0000000Z   error: '^[[1mbold^[[0m'",
  ].join("\n");
  const s = triageState({ job: "test", log });
  assert.match(s, /^job: test\nfailing tests: first thing \| second thing\n\n--- log ---\nnot ok 2 - first thing/);
  assert.ok(s.includes("boom red") && s.includes("bold"));
  assert.ok(!/2026-10-01T|\u001b|\^\[/.test(s));
});

test("triageState: with no failing test it quotes up to the first error and drops GitHub's post-job cleanup", () => {
  const log = ["npm audit report", "Severity: high", "##[error]Process completed with exit code 1.", "Post job cleanup.", "git config noise"].join("\n");
  const s = triageState({ job: "security", log });
  assert.match(s, /failing tests: none named/);
  assert.ok(s.includes("Severity: high") && s.endsWith("exit code 1."));
  assert.ok(!s.includes("noise"));
  const noErr = triageState({ job: "security", log: ["Finding: x", "RuleID: y", "Post job cleanup.", "noise"].join("\n") });
  assert.ok(noErr.includes("RuleID: y") && !noErr.includes("noise"));
});

test("triageState: the commit's changed areas and the failure history go in the header when given", () => {
  assert.deepEqual(areasOf(["apps/ui/a.js", "apps/ui/b.js", ".scratch/x.md", "README.md"]), [["apps/ui", 2], [".scratch", 1], ["(root)", 1]]);
  const s = triageState({ job: "test", log: "not ok 1 - t", changed: [".scratch/a.md", ".scratch/b.md"], history: { days: 14, otherChanges: 3, thisBranch: 0 } });
  assert.match(s, /\ncommit changes: \.scratch \(2 files\)\n/);
  assert.match(s, /same failing tests in the last 14 days: failed on 3 other changes \(main commits or other branches\), and on 0 earlier pushes of this branch/);
  assert.match(triageState({ job: "test", log: "", changed: [] }), /commit changes: no files/);
  assert.ok(!/commit changes|same failing/.test(triageState({ job: "test", log: "" })), "no facts given, none shown");
});

test("the committed triage set has 30 or more cases, each with a known label and its evidence, and none trips the secret check", async () => {
  const { hasSecret } = await import("./exposure.mjs");
  const cases = parseCases(readFileSync(new URL("./jev-evals/triage/cases.jsonl", import.meta.url), "utf8"));
  assert.ok(cases.length >= 30, `${cases.length} cases`);
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
  for (const c of cases) {
    assert.ok(["flake", "code", "env", "other"].includes(c.label), c.id);
    assert.ok(typeof c.evidence === "string" && c.evidence.length > 20, c.id);
    assert.ok(!hasSecret(c.text), c.id);
    assert.ok(c.text.length <= 16000, c.id);
  }
});

test("the CLI refuses an unknown use case, a model outside the two, and a missing key, before reading any case", () => {
  const run = (args, env = {}) => spawnSync(process.execPath, [fileURLToPath(new URL("./jev-eval.mjs", import.meta.url)), ...args],
    { encoding: "utf8", env: { PATH: process.env.PATH, ...env } });
  assert.equal(run(["nope", "--model", "jev-1.13.0"]).status, 2);
  assert.match(run(["triage", "--model", "jev-9"], { TYPESAFE_API_KEY: KEY }).stderr, /--model must be one of/);
  const r = run(["triage", "--model", "jev-1.13.0"]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /TYPESAFE_API_KEY is not set/);
});
