#!/usr/bin/env node
// den-mvp/41: builds the claim-check cases from a private labels.jsonl on the board (handoff text never enters this
// repo). Each label row: { id, ticket: "<feature>/<NN>", criterion: <1-based number>, handoff: "<feature>/handoffs/<f>.md",
// label, evidence }. The text is claimCheckState over the ticket's Nth acceptance criterion, its title and the handoff.
// Usage: node scripts/jev-evals/claim-check/build-cases.mjs <dir under .scratch holding labels.jsonl>
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { claimCheckState } from "../../jev.mjs";

const dir = process.argv[2];
if (!dir) { process.stderr.write("usage: build-cases.mjs <dir with labels.jsonl>\n"); process.exit(2); }
const scratch = path.resolve(dir.slice(0, dir.indexOf(".scratch") + ".scratch".length));
const inside = (p) => { const r = path.resolve(scratch, p); if (!r.startsWith(scratch + path.sep)) throw new Error(`outside the board: ${p}`); return r; };
const issue = (ref) => {
  const [feature, nn] = ref.split("/");
  const f = readdirSync(inside(`${feature}/issues`)).find((x) => x.startsWith(`${nn}-`) && x.endsWith(".md"));
  return readFileSync(inside(`${feature}/issues/${f}`), "utf8");
};
const criteriaOf = (md) => (md.split(/^## Acceptance criteria\s*$/m)[1] ?? "").split(/^## /m)[0]
  .split("\n").filter((l) => /^\s*- \[[ x]\]/.test(l)).map((l) => l.replace(/^\s*- \[[ x]\]\s*/, ""));
const rows = readFileSync(path.join(dir, "labels.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const out = rows.map((r) => {
  const md = issue(r.ticket);
  const criterion = criteriaOf(md)[r.criterion - 1];
  if (!criterion) throw new Error(`${r.id}: no criterion ${r.criterion}`);
  const text = claimCheckState({ criterion, title: md.match(/^#\s.*$/m)?.[0], handoff: readFileSync(inside(r.handoff), "utf8") });
  return { id: r.id, label: r.label, text, evidence: r.evidence };
});
writeFileSync(path.join(dir, "cases.jsonl"), out.map((c) => JSON.stringify(c)).join("\n") + "\n");
process.stdout.write(`${out.length} cases\n`);
