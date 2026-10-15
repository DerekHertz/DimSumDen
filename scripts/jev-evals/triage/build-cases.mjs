#!/usr/bin/env node
// den-mvp/40: builds cases.jsonl for the triage eval from labels.jsonl (id = <run>-<job>, label, evidence).
// Each case's text is what the den would send: triageState over the job's failed-step log, with the two facts code
// knows at that moment: the commit's changed files (GitHub's commit API, against its first parent) and where the
// same failing tests failed in the 14 days before, counted over the earlier failed runs in this set (every failed
// CI run of the repo since 2026-09-28) and split into other changes (main commits, other branches) and earlier pushes of the same branch. Labels never feed the text.
// Usage: node scripts/jev-evals/triage/build-cases.mjs [--logs <dir>]
// With --logs, reads <dir>/<run>-<job>.log; without it, asks gh for every log. Run metadata always comes from gh.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { triageState } from "../../jev.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DAYS = 14;
const logsAt = process.argv[2] === "--logs" ? process.argv[3] : null;
const gh = (args) => execFileSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const failingNames = (log) => [...new Set([...String(log).matchAll(/not ok \d+ - (.+)$/gm)].map((m) => m[1].trim()))];

const labels = readFileSync(path.join(HERE, "labels.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const runs = new Map();
const runOf = (run) => {
  if (!runs.has(run)) {
    const r = JSON.parse(gh(["run", "view", run, "--json", "headSha,headBranch,createdAt,jobs"]));
    const files = JSON.parse(gh(["api", `repos/{owner}/{repo}/commits/${r.headSha}`, "-q", "[.files[].filename]"]));
    runs.set(run, { sha: r.headSha, branch: r.headBranch, at: Date.parse(r.createdAt), jobs: r.jobs, files });
  }
  return runs.get(run);
};

const rows = labels.map(({ id, label, evidence }) => {
  const [run, job] = id.split("-");
  const r = runOf(run);
  const log = logsAt ? readFileSync(path.join(logsAt, `${id}.log`), "utf8") : gh(["run", "view", run, "--job", job, "--log-failed"]);
  const name = r.jobs.find((j) => String(j.databaseId) === job)?.name ?? "unknown";
  return { id, label, evidence, run: r, job: name, log, names: failingNames(log) };
});

const out = rows.map((c) => {
  const before = rows.filter((o) => o.run.at < c.run.at && o.run.at >= c.run.at - DAYS * 864e5 && o.run.sha !== c.run.sha &&
    o.job === c.job && o.names.some((n) => c.names.includes(n)));
  const shas = (xs) => new Set(xs.map((o) => o.run.sha)).size;
  // On main every commit is its own change; on a branch, earlier pushes are the same change in progress.
  const same = (o) => o.run.branch === c.run.branch && c.run.branch !== "main";
  const history = { days: DAYS, otherChanges: shas(before.filter((o) => !same(o))), thisBranch: shas(before.filter(same)) };
  return { id: c.id, label: c.label, text: triageState({ job: c.job, log: c.log, changed: c.run.files, history }), evidence: c.evidence };
});
writeFileSync(path.join(HERE, "cases.jsonl"), out.map((c) => JSON.stringify(c)).join("\n") + "\n");
process.stdout.write(`${out.length} cases\n`);
