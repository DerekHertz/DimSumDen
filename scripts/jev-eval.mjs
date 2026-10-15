#!/usr/bin/env node
// den-mvp/40: Jev eval harness. Runs one use case over a labelled case set and writes a report, so a use case is
// judged on one sitting's numbers instead of days of relay trials.
// Usage: node scripts/jev-eval.mjs <usecase> --model jev-1.13.0|jev-1.14.0 [--cases <path>] [--out <dir>] [--limit N] [--repeat N]
// Jev is not deterministic (the same text moves its confidence by up to ~0.1 between calls), so --repeat runs the
// set N times (default 5); the report pools every run, and a safety miss in any run counts against its floor.
// Cases: scripts/jev-evals/<usecase>/cases.jsonl, one { id, text, label } per line (extra fields are kept, unused).
// Writes report-<model>-<date>.md and results-<model>-<date>.jsonl beside the cases. Every case's text passes the
// same secret check as jev.mjs; a blocked case is skipped and listed, never sent. TYPESAFE_API_KEY is read from the
// environment and never written or printed.
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { hasSecret } from "./exposure.mjs";
import { fetchTransport, MAX_CHARS } from "./jev.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const MODELS = ["jev-1.13.0", "jev-1.14.0"];
export const FLOORS = [0, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95];
const BUCKETS = [[0, 0.5], [0.5, 0.7], [0.7, 0.8], [0.8, 0.9], [0.9, 1.0001]];

// Each use case names the Jev point it asks, its labels, and its safety miss: the one wrong answer that does harm.
export const USECASES = {
  triage: {
    point: "triage",
    labels: ["flake", "code", "env", "other"],
    miss: { label: "code", pick: "flake", why: "a real failure called a flake: a rerun would hide it" },
    bar: { accuracy: 0.85, costPerCase: 0.001, p95ms: 3000 },
  },
};

export function parseCases(text) {
  return String(text).split("\n").filter((l) => l.trim()).map((l, i) => {
    const c = JSON.parse(l);
    if (typeof c.id !== "string" || typeof c.text !== "string" || typeof c.label !== "string") {
      throw new Error(`case line ${i + 1}: id, text and label must be strings`);
    }
    return c;
  });
}

// Runs every case through the transport, one at a time (latency is per call). -> per-case results.
export async function runEval({ usecase, cases, model, apiKey, transport = fetchTransport, timeoutMs = 20000, clock = Date.now }) {
  const u = USECASES[usecase];
  const out = [];
  for (const c of cases) {
    const base = { id: c.id, label: c.label };
    if (!u.labels.includes(c.label)) { out.push({ ...base, skip: "unknown-label" }); continue; }
    if (hasSecret(c.text)) { out.push({ ...base, skip: "blocked-input" }); continue; }
    const text = c.text.length > MAX_CHARS ? c.text.slice(0, MAX_CHARS) : c.text;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    const t0 = clock();
    try {
      const a = await transport({ point: u.point, text, model, apiKey, signal: ctl.signal });
      const ms = clock() - t0;
      const pick = u.labels.includes(a?.pick) ? a.pick : null;
      const conf = pick && typeof a?.probs?.[pick] === "number" ? a.probs[pick] : null;
      out.push({ ...base, pick, conf, ms, tokens: Number(a?.usage?.tokens) || 0, cost: Number(a?.usage?.cost) || 0, ...(pick ? {} : { error: "unparseable" }) });
    } catch (e) {
      out.push({ ...base, error: ctl.signal.aborted ? "timeout" : e?.status ? `http ${e.status}` : "network", ms: clock() - t0 });
    } finally {
      clearTimeout(timer);
    }
  }
  return out;
}

const pct = (xs, p) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
};

// Pure scoring of a run. A skipped or errored case is not scored and is listed.
export function score(usecase, results) {
  const u = USECASES[usecase];
  const answered = results.filter((r) => r.pick);
  const right = answered.filter((r) => r.pick === r.label).length;
  const confusion = Object.fromEntries(u.labels.map((l) => [l, Object.fromEntries(u.labels.map((p) => [p, 0]))]));
  for (const r of answered) confusion[r.label][r.pick] += 1;
  const buckets = BUCKETS.map(([lo, hi]) => {
    const inB = answered.filter((r) => r.conf != null && r.conf >= lo && r.conf < hi);
    return { lo, hi: Math.min(hi, 1), n: inB.length, right: inB.filter((r) => r.pick === r.label).length };
  });
  const isMiss = (r) => r.label === u.miss.label && r.pick === u.miss.pick;
  const misses = answered.filter(isMiss).map((r) => ({ id: r.id, conf: r.conf }));
  // At each floor, the picks below it fall back to today's rule (a person looks), so only picks at or above it count.
  const floors = FLOORS.map((f) => {
    const kept = answered.filter((r) => (r.conf ?? 0) >= f);
    return { floor: f, kept: kept.length, right: kept.filter((r) => r.pick === r.label).length, misses: kept.filter(isMiss).length };
  });
  const safeFloor = floors.find((f) => f.misses === 0)?.floor ?? null;
  const ms = results.filter((r) => typeof r.ms === "number" && r.pick).map((r) => r.ms);
  const cost = answered.reduce((s, r) => s + r.cost, 0);
  const tokens = answered.reduce((s, r) => s + r.tokens, 0);
  return {
    total: results.length, answered: answered.length, right,
    accuracy: answered.length ? right / answered.length : null,
    confusion, buckets, misses, floors, safeFloor,
    skipped: results.filter((r) => r.skip).map((r) => ({ id: r.id, why: r.skip })),
    errors: results.filter((r) => r.error).map((r) => ({ id: r.id, why: r.error })),
    tokens, cost, costPerCase: answered.length ? cost / answered.length : null,
    p50ms: pct(ms, 50), p95ms: pct(ms, 95),
  };
}

// The bar: accuracy, zero safety misses at some floor, cost per case and p95 latency.
export function verdict(usecase, s) {
  const b = USECASES[usecase].bar;
  const checks = [
    ["accuracy", s.accuracy != null && s.accuracy >= b.accuracy, `${fmtPct(s.accuracy)} (bar ${fmtPct(b.accuracy)})`],
    ["safety", s.safeFloor != null, s.safeFloor == null ? "a miss at every floor" : `zero misses from floor ${s.safeFloor}`],
    ["cost", s.costPerCase != null && s.costPerCase < b.costPerCase, `$${(s.costPerCase ?? 0).toFixed(6)} per case (bar $${b.costPerCase})`],
    ["latency", s.p95ms != null && s.p95ms < b.p95ms, `p95 ${s.p95ms ?? "-"} ms (bar ${b.p95ms} ms)`],
  ];
  return { pass: checks.every((c) => c[1]), checks };
}

const fmtPct = (x) => (x == null ? "-" : `${(x * 100).toFixed(1)}%`);

export function renderReport({ usecase, model, date, s, results, runs = [] }) {
  const u = USECASES[usecase];
  const v = verdict(usecase, s);
  const L = [];
  L.push(`# Jev eval: ${usecase}, ${model}, ${date}`, "");
  L.push(`**Result:** ${v.pass ? "PASS" : "FAIL"} on the bar.`, "");
  for (const [name, ok, text] of v.checks) L.push(`- ${ok ? "pass" : "FAIL"} ${name}: ${text}`);
  L.push("", `Calls: ${s.total}; answered ${s.answered}; right ${s.right}; skipped ${s.skipped.length}; errors ${s.errors.length}.`, "");
  if (runs.length > 1) {
    L.push(`## ${runs.length} runs of the same set, pooled below`, "", "| run | accuracy | misses | lowest floor with none |", "|---|---|---|---|");
    runs.forEach((r, i) => L.push(`| ${i + 1} | ${fmtPct(r.accuracy)} | ${r.misses.length} | ${r.safeFloor ?? "none"} |`));
    L.push("");
  }
  L.push("## Confusion (rows: truth, columns: Jev)", "", `| truth | ${u.labels.join(" | ")} |`, `|---|${u.labels.map(() => "---").join("|")}|`);
  for (const l of u.labels) L.push(`| ${l} | ${u.labels.map((p) => s.confusion[l][p]).join(" | ")} |`);
  L.push("", "## Accuracy by confidence", "", "| confidence | cases | right | accuracy |", "|---|---|---|---|");
  for (const b of s.buckets) L.push(`| ${b.lo.toFixed(2)}-${b.hi.toFixed(2)} | ${b.n} | ${b.right} | ${b.n ? fmtPct(b.right / b.n) : "-"} |`);
  L.push("", `## Safety misses: ${u.miss.label} labelled ${u.miss.pick} (${u.miss.why})`, "");
  L.push(s.misses.length ? s.misses.map((m) => `- ${m.id} at ${m.conf?.toFixed(3) ?? "-"}`).join("\n") : "None.");
  L.push("", "| floor | picks kept | right | accuracy kept | misses |", "|---|---|---|---|---|");
  for (const f of s.floors) L.push(`| ${f.floor} | ${f.kept} | ${f.right} | ${f.kept ? fmtPct(f.right / f.kept) : "-"} | ${f.misses} |`);
  L.push("", `Lowest floor with zero misses: ${s.safeFloor ?? "none"}.`, "");
  L.push("## Cost and speed", "", `- Input tokens: ${s.tokens} (${s.answered ? Math.round(s.tokens / s.answered) : 0} per case)`);
  L.push(`- Cost: $${s.cost.toFixed(6)} total, $${(s.costPerCase ?? 0).toFixed(6)} per case`, `- Latency: p50 ${s.p50ms ?? "-"} ms, p95 ${s.p95ms ?? "-"} ms`, "");
  if (s.skipped.length) L.push("## Skipped", "", ...s.skipped.map((x) => `- ${x.id}: ${x.why}`), "");
  if (s.errors.length) L.push("## Errors", "", ...s.errors.map((x) => `- ${x.id}: ${x.why}`), "");
  L.push("## Per case", "", "| case | truth | Jev, each run (confidence) |", "|---|---|---|");
  const byId = new Map();
  for (const r of results) byId.set(r.id, [...(byId.get(r.id) ?? []), r]);
  for (const [id, rs] of byId) L.push(`| ${id} | ${rs[0].label} | ${rs.map((r) => `${r.pick ?? r.skip ?? r.error}${r.conf != null ? ` (${r.conf.toFixed(2)})` : ""}`).join(", ")} |`);
  return L.join("\n") + "\n";
}

function usage(msg) {
  process.stderr.write(`jev-eval: ${msg}\nusage: node scripts/jev-eval.mjs <${Object.keys(USECASES).join("|")}> --model <${MODELS.join("|")}> [--cases <path>] [--out <dir>] [--limit N]\n`);
  return 2;
}

async function main(argv, env = process.env) {
  const usecase = argv[0];
  if (!Object.hasOwn(USECASES, usecase)) return usage(`use case must be one of ${Object.keys(USECASES).join(", ")}`);
  const opts = {};
  for (let i = 1; i < argv.length; i += 2) {
    if (!["--model", "--cases", "--out", "--limit", "--repeat"].includes(argv[i]) || argv[i + 1] === undefined) return usage(`bad argument ${argv[i]}`);
    opts[argv[i].slice(2)] = argv[i + 1];
  }
  if (!MODELS.includes(opts.model)) return usage(`--model must be one of ${MODELS.join(", ")}`);
  const apiKey = env.TYPESAFE_API_KEY;
  if (!apiKey) return usage("TYPESAFE_API_KEY is not set");
  const dir = path.join(HERE, "jev-evals", usecase);
  let cases = parseCases(readFileSync(opts.cases ?? path.join(dir, "cases.jsonl"), "utf8"));
  if (opts.limit) cases = cases.slice(0, Number(opts.limit));
  const repeat = Number(opts.repeat ?? 5);
  if (!Number.isInteger(repeat) || repeat < 1 || repeat > 20) return usage("--repeat must be 1 to 20");
  const runs = [];
  for (let i = 0; i < repeat; i++) runs.push((await runEval({ usecase, cases, model: opts.model, apiKey })).map((r) => ({ ...r, run: i + 1 })));
  const results = runs.flat();
  const s = score(usecase, results);
  const date = new Date().toISOString().slice(0, 10);
  const out = opts.out ?? dir;
  mkdirSync(out, { recursive: true });
  const stem = `${opts.model}-${date}`;
  writeFileSync(path.join(out, `report-${stem}.md`), renderReport({ usecase, model: opts.model, date, s, results, runs: runs.map((r) => score(usecase, r)) }));
  writeFileSync(path.join(out, `results-${stem}.jsonl`), results.map((r) => JSON.stringify(r)).join("\n") + "\n");
  const v = verdict(usecase, s);
  process.stdout.write(`${usecase} ${opts.model}: ${v.pass ? "PASS" : "FAIL"}; accuracy ${fmtPct(s.accuracy)}; safe floor ${s.safeFloor ?? "none"}; ` +
    `runs ${runs.map((r) => fmtPct(score(usecase, r).accuracy)).join(" ")}; $${(s.costPerCase ?? 0).toFixed(6)}/case; p95 ${s.p95ms ?? "-"} ms; skipped ${s.skipped.length}; errors ${s.errors.length}\n`);
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then((c) => process.exit(c));
}
