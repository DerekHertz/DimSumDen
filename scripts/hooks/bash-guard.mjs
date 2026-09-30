#!/usr/bin/env node
// PreToolUse hook for Bash. Reads the hook JSON on stdin; exit 2 blocks the call, exit 0 allows it.
// organism-infra/80: jg runs only through scripts/jg.mjs (handoffs/67-security.md, Q2). This is a
// string check, so shell indirection (eval, aliases, a script file) can bypass it: residual Low.
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

// jg (or its package name) in command position, bare or by path; scripts/jg.mjs does not match.
const RAW_JG = /(?:^|[\s;&|()`'"])(?:\S*\/)?(?:jg|jevgrep)(?=$|[\s;&|()`])/;

const RULES = [
  {
    test: (command) => RAW_JG.test(command),
    reason: "bash-guard: raw jg calls are blocked. Use the wrapper: node scripts/jg.mjs \"<question>\" [root] (organism-infra/80).",
  },
];

export function check(input) {
  if (input?.tool_name !== "Bash") return null;
  const command = String(input.tool_input?.command ?? "");
  return RULES.find((r) => r.test(command))?.reason ?? null;
}

function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return 0;
  }
  const reason = check(input);
  if (!reason) return 0;
  // Claude Code feeds stderr back to the model on exit 2; stdout carries it for direct callers.
  process.stdout.write(reason + "\n");
  process.stderr.write(reason + "\n");
  return 2;
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  process.exit(main());
}
