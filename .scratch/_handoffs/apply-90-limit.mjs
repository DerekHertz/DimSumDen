// Run from the main checkout: node apply-90-limit.mjs
// Moves the 5-hour wrap-up threshold from 80% to 90% (stop-now from 90% to 95%). The weekly check stays at 80%.
import { readFileSync, writeFileSync } from "node:fs";
const edits = [
  ["CLAUDE.md", "usage at 80%+,", "5-hour usage at 90%+,"],
  [".claude/agents/orchestrator.md", "At 80% or more, wrap up instead of dispatching.", "At 90% or more of the 5-hour window, wrap up instead of dispatching."],
  [".claude/skills/organism-protocol/SKILL.md", "- usage at 80% or more", "- 5-hour usage at 90% or more"],
  [".claude/skills/usage-watch/SKILL.md", "If the 5-hour window is at or above 80%, start wrapping up.", "If the 5-hour window is at or above 90%, start wrapping up."],
  [".claude/skills/usage-watch/SKILL.md", "| under 80% | Carry on.", "| under 90% | Carry on."],
  [".claude/skills/usage-watch/SKILL.md", "| 80–89% | **Wrap up.**", "| 90–94% | **Wrap up.**"],
  [".claude/skills/usage-watch/SKILL.md", "| 90% or more | **Stop now.**", "| 95% or more | **Stop now.**"],
];
for (const [f, from, to] of edits) {
  const t = readFileSync(f, "utf8");
  if (!t.includes(from)) { console.error(`MISSING in ${f}: ${from}`); process.exitCode = 1; continue; }
  writeFileSync(f, t.replace(from, to));
  console.log(`ok ${f}`);
}
