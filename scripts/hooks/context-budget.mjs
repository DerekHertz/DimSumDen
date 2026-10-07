#!/usr/bin/env node
// PreToolUse hook (organism-infra/162): enforces the cell context budget (organism-infra/119) with code.
// Reads the hook JSON on stdin. Applies only to cell sessions (subagent calls: the input has agent_id);
// the orchestrator main session is never gated here (it has its own gate in cell-start).
// Thresholds come from scripts/context-budget.json by the call's agent_type (organism-infra/145):
//   under warn           -> allow, silent
//   warn to under stop   -> allow, inject a checkpoint warning (hookSpecificOutput.additionalContext)
//   stop and over        -> exit 2 with wrap-up instructions, except the wrap-up calls below
//   no reading / bad input -> allow (fails open)
// The cell's own reading comes from `scripts/context.mjs --self`, run as a child with the session from
// the hook input (the hook's env does not carry CLAUDE_CODE_SESSION_ID).
import { spawnSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { budgetFor } from "../context-budget.mjs";

const SESSION_ID = /^[\w.-]+$/;
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
// A backslash outside single quotes is chain-unsafe: it can escape a quote and hide a chain (organism-infra/165).
export function isSimpleCommand(command) {
  if (/[`$\n\r]/.test(command)) return false;
  if (command.replace(/'[^']*'/g, "").includes("\\")) return false;
  const bare = command.replace(/"[^"]*"|'[^']*'/g, "");
  return !/[;&|<>()"']/.test(bare);
}

export function isWrapUpBash(command) {
  const c = String(command ?? "").trim();
  return isSimpleCommand(c) && WRAP_UP_BASH.some((re) => re.test(c));
}

// Candidate roots of the session scratchpad: /tmp/claude-<uid>/<project slug>/<session>/scratchpad
function scratchpadRoots(sessionId) {
  if (!sessionId || !SESSION_ID.test(sessionId)) return [];
  const bases = new Set(["/tmp", os.tmpdir()]);
  return [...bases].map((b) => new RegExp(`^${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/claude-[^/]+/[^/]+/${sessionId}/scratchpad/`));
}

function resolveFrom(input, filePath) {
  return path.resolve(String(input.cwd || process.cwd()), String(filePath ?? ""));
}

// The main checkout: $ORGANISM_ROOT when set, else the first entry of `git worktree list` from the call's cwd.
function mainCheckout(input) {
  if (process.env.ORGANISM_ROOT) return path.resolve(process.env.ORGANISM_ROOT);
  const r = spawnSync("git", ["worktree", "list", "--porcelain", "-z"], { cwd: String(input.cwd || process.cwd()), encoding: "utf8", timeout: 10_000 });
  if (r.status !== 0) return null;
  const first = r.stdout.split("\0").find((l) => l.startsWith("worktree "));
  return first ? path.resolve(first.slice("worktree ".length)) : null;
}

export function isWrapUpWrite(input) {
  const filePath = input?.tool_input?.file_path;
  if (!filePath) return false;
  const abs = resolveFrom(input, filePath);
  const main = mainCheckout(input);
  if (main && abs.startsWith(path.join(main, ".scratch") + path.sep)) return true;
  return scratchpadRoots(input.session_id).some((re) => re.test(abs));
}

export function isWrapUpCall(input) {
  const tool = input?.tool_name;
  if (tool === "Bash") return isWrapUpBash(input.tool_input?.command);
  if (tool === "Write" || tool === "Edit") return isWrapUpWrite(input);
  return false;
}

export function readContextTokens(input) {
  // Never hand an unvalidated id to context.mjs (it becomes a path segment there); "." and ".." also fail.
  if (!input.session_id || !SESSION_ID.test(String(input.session_id)) || /^\.+$/.test(String(input.session_id))) return null;
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

export const warningText = (tokens, stop) =>
  `Context budget: this cell is at ${k(tokens)} of its ${k(stop)} budget. Checkpoint now: finish the current stage, start no new exploration, and plan a WIP commit, a handoff and board release. At ${k(stop)} every call except the wrap-up calls is refused.`;

export const refusalText = (tokens, stop) =>
  `context-budget: this cell is at ${k(tokens)}, over the ${k(stop)} budget (organism-infra/119), so this call is refused. Wrap up now: make a WIP commit (git add <paths>, git commit), draft the handoff (Write under .scratch/ or the session scratchpad), publish it with npm run board -- handoff, run npm run board -- release <ref> --keep-status, and end your final report with outcome: partial. Allowed now: git add, git commit, npm run board -- handoff|release|comment (one simple command, no chaining), node scripts/context.mjs, and Write/Edit under .scratch/ or the session scratchpad.`;

// Returns {code, stdout, stderr}.
export function decide(input) {
  const allow = { code: 0, stdout: "", stderr: "" };
  if (!isCellSession(input)) return allow;
  const tokens = readContextTokens(input);
  const { warn, stop } = budgetFor(input.agent_type);
  if (tokens === null || tokens < warn) return allow;
  if (tokens < stop) {
    const out = { hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: warningText(tokens, stop) } };
    return { code: 0, stdout: JSON.stringify(out) + "\n", stderr: "" };
  }
  if (isWrapUpCall(input)) return allow;
  const msg = refusalText(tokens, stop) + "\n";
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
