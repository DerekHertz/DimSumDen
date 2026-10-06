#!/usr/bin/env node
// PreToolUse hook (organism-infra/162): enforces the cell context budget (organism-infra/119) with code.
// Reads the hook JSON on stdin. Applies only to cell sessions (subagent calls: the input has agent_id);
// the orchestrator main session is never gated here (it has its own gate in cell-start).
//   under 70k            -> allow, silent
//   70k to under 80k     -> allow, inject a checkpoint warning (hookSpecificOutput.additionalContext)
//   80k and over         -> exit 2 with wrap-up instructions, except the wrap-up calls below
//   no reading / bad input -> allow (fails open)
// The cell's own reading comes from `scripts/context.mjs --self`, run as a child with the session from
// the hook input (the hook's env does not carry CLAUDE_CODE_SESSION_ID).
import { spawnSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const WARN_AT = 70_000;
export const STOP_AT = 80_000;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTEXT_SCRIPT = path.join(HERE, "..", "context.mjs");

const WRAP_UP_BASH = [
  /^git (?:add|commit)(?:\s|$)/,
  /^npm run board -- (?:handoff|release|comment)(?:\s|$)/,
  /^node scripts\/context\.mjs(?:\s+--self)?$/,
];

export function isCellSession(input) {
  return Boolean(input?.agent_id) && input.agent_type !== "orchestrator";
}

// One simple command only: no chaining, pipes, redirects, substitution or newlines. Quoted text may
// hold ; & | < > ( ) (a commit message), but never $ or a backtick (expansion inside double quotes).
export function isSimpleCommand(command) {
  if (/[`$\n\r]/.test(command)) return false;
  const bare = command.replace(/"[^"]*"|'[^']*'/g, "");
  return !/[;&|<>()"']/.test(bare);
}

export function isWrapUpBash(command) {
  const c = String(command ?? "").trim();
  return isSimpleCommand(c) && WRAP_UP_BASH.some((re) => re.test(c));
}

// Candidate roots of the session scratchpad: /tmp/claude-<uid>/<project slug>/<session>/scratchpad
function scratchpadRoots(sessionId) {
  if (!sessionId || !/^[\w.-]+$/.test(sessionId)) return [];
  const bases = new Set(["/tmp", os.tmpdir()]);
  return [...bases].map((b) => new RegExp(`^${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/claude-[^/]+/[^/]+/${sessionId}/scratchpad/`));
}

function resolveFrom(input, filePath) {
  return path.resolve(String(input.cwd || process.cwd()), String(filePath ?? ""));
}

export function isWrapUpWrite(input) {
  const filePath = input?.tool_input?.file_path;
  if (!filePath) return false;
  const abs = resolveFrom(input, filePath);
  if (abs.includes(`${path.sep}.scratch${path.sep}`)) return true;
  return scratchpadRoots(input.session_id).some((re) => re.test(abs));
}

export function isWrapUpCall(input) {
  const tool = input?.tool_name;
  if (tool === "Bash") return isWrapUpBash(input.tool_input?.command);
  if (tool === "Write" || tool === "Edit") return isWrapUpWrite(input);
  return false;
}

export function readContextTokens(input) {
  if (!input.session_id) return null;
  const env = { ...process.env, CLAUDE_CODE_SESSION_ID: String(input.session_id) };
  const r = spawnSync("node", [CONTEXT_SCRIPT, "--self"], {
    cwd: input.cwd || process.cwd(),
    env,
    encoding: "utf8",
    timeout: 10_000,
  });
  if (r.status !== 0) return null;
  try {
    const t = JSON.parse(r.stdout).context_tokens;
    return typeof t === "number" ? t : null;
  } catch {
    return null;
  }
}

const k = (n) => `${Math.round(n / 1000)}k`;

export const warningText = (tokens) =>
  `Context budget: this cell is at ${k(tokens)} of its 80k budget. Checkpoint now: finish the current stage, start no new exploration, and plan a WIP commit, a handoff and board release. At 80k every call except the wrap-up calls is refused.`;

export const refusalText = (tokens) =>
  `context-budget: this cell is at ${k(tokens)}, over the 80k budget (organism-infra/119), so this call is refused. Wrap up now: make a WIP commit (git add <paths>, git commit), draft the handoff (Write under .scratch/ or the session scratchpad), publish it with npm run board -- handoff, run npm run board -- release <ref> --keep-status, and end your final report with outcome: partial. Allowed now: git add, git commit, npm run board -- handoff|release|comment (one simple command, no chaining), node scripts/context.mjs, and Write/Edit under .scratch/ or the session scratchpad.`;

// Returns {code, stdout, stderr}.
export function decide(input) {
  const allow = { code: 0, stdout: "", stderr: "" };
  if (!isCellSession(input)) return allow;
  const tokens = readContextTokens(input);
  if (tokens === null || tokens < WARN_AT) return allow;
  if (tokens < STOP_AT) {
    const out = { hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: warningText(tokens) } };
    return { code: 0, stdout: JSON.stringify(out) + "\n", stderr: "" };
  }
  if (isWrapUpCall(input)) return allow;
  const msg = refusalText(tokens) + "\n";
  return { code: 2, stdout: msg, stderr: msg };
}

function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return 0;
  }
  if (!input || typeof input !== "object") return 0;
  const r = decide(input);
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.code;
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  process.exit(main());
}
