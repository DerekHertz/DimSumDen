#!/usr/bin/env node
// den-mvp/42: builds the grade cases from a private rubric.json and scores.jsonl on the board (handoff text never
// enters this repo). One case per (handoff, rubric item): the handoff text, home paths scrubbed; the item as the
// question's instructions; the hand score as the label; the handoff as the group.
// Usage: node scripts/jev-evals/grade/build-cases.mjs <dir under .scratch holding rubric.json and scores.jsonl>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gradeInstructions, MAX_CHARS, scrubHome } from "../../jev.mjs";

const dir = process.argv[2];
if (!dir) { process.stderr.write("usage: build-cases.mjs <dir with rubric.json and scores.jsonl>\n"); process.exit(2); }
const scratch = path.resolve(dir.slice(0, dir.indexOf(".scratch") + ".scratch".length));
const inside = (p) => { const r = path.resolve(scratch, p); if (!r.startsWith(scratch + path.sep)) throw new Error(`outside the board: ${p}`); return r; };
const rubric = JSON.parse(readFileSync(path.join(dir, "rubric.json"), "utf8"));
const rows = readFileSync(path.join(dir, "scores.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const out = rows.flatMap((r) => {
  const text = scrubHome(readFileSync(inside(r.handoff), "utf8")).slice(0, MAX_CHARS);
  return Object.entries(rubric).map(([item, words]) => {
    const score = r.scores[item];
    if (!Number.isInteger(score) || score < 0 || score > 5) throw new Error(`${r.handoff}: ${item} score must be 0-5`);
    return { id: `${r.handoff}:${item}`, group: r.handoff, label: String(score), instructions: gradeInstructions(words), text };
  });
});
writeFileSync(path.join(dir, "cases.jsonl"), out.map((c) => JSON.stringify(c)).join("\n") + "\n");
process.stdout.write(`${out.length} cases from ${rows.length} handoffs\n`);
