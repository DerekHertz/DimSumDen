# 162 security handoff

Verdict: Security pass. Branch feat/162-context-budget-hook at cb286b4, diff against origin/main (4 files: hook, 2 test files, .claude/settings.json).

## Checks

- gitleaks detect over origin/main..cb286b4: 3 commits scanned, no leaks.
- Dependencies: none added (package.json and lockfile untouched). npm audit not needed; `npm ci` reported 0 vulnerabilities.
- Shelling out: `spawnSync("node", [CONTEXT_SCRIPT, "--self"])` uses an argument array, no shell, fixed script path from `import.meta.url`. Session id goes into an env var only.
- Network: none. The hook only reads stdin and the local transcript via context.mjs.
- settings.json: PreToolUse entry runs the repo script by `$CLAUDE_PROJECT_DIR`, timeout 15. Valid JSON. The hook emits no `permissionDecision`, so an exit 0 does not auto-approve anything; normal permission rules still apply to every call it lets through.
- Untrusted text to UI/shell/path: the warning and refusal texts carry only a rounded token count, no agent or web text.
- Fails open on bad input or no reading (by design, documented in the file header).

## Findings (non-blocking)

1. scripts/hooks/context-budget.mjs:35-39 (`isSimpleCommand`), low: an escaped-quote payload passes the chain check at 80k+. `git commit -m \"x; touch /tmp/y; echo \"` returns true, because the quote-stripping regex pairs the escaped quotes and hides the `;`, but the shell runs three commands. Impact is only that a chained command gets through the budget gate; the normal permission system still decides whether it runs, and the gate is cost control, not a security boundary. Fix: also refuse any backslash outside single quotes (add `\\` to the first character class), or treat `\` as chain-unsafe.
2. scripts/hooks/context-budget.mjs:61 (`isWrapUpWrite`), low: any path containing a `/.scratch/` segment counts as a wrap-up write, not only the main checkout's board (for example `/x/src/.scratch/a`). Cosmetic for a budget gate; tighten to `$ORGANISM_ROOT/.scratch/` or the worktree root if wanted.
3. scripts/hooks/context-budget.mjs:74 (`readContextTokens`), low/info: `session_id` is passed to context.mjs unvalidated; context.mjs joins it into a path (`<projects>/<dir>/<id>.jsonl`) for a read-only stat/parse. The value comes from the harness, not from agent text, so no practical exposure. The scratchpad branch does validate it (`/^[\w.-]+$/`); the same check here would be consistent.

## Post-apply check (from developer handoff, still open for the user)

Confirm in a real cell that the subagent PreToolUse input carries `agent_id` and the parent `session_id`.

```json
{
  "ticket": "organism-infra/162-context-budget-hook",
  "cell": "security",
  "current_step": "security review done: pass, three low findings, no secrets, no new dependencies",
  "artifacts": [
    {"path": "scripts/hooks/context-budget.mjs", "note": "reviewed; findings 1-3 above"},
    {"path": ".claude/settings.json", "note": "PreToolUse hook entry reviewed, no issue"}
  ],
  "decisions": [
    {"decision": "Security pass, findings low and non-blocking", "why": "the hook is a cost-control gate that only denies; it never grants permission, uses no shell, and takes no untrusted text"}
  ],
  "failures": [],
  "pending": [
    {"item": "Optional follow-up: harden isSimpleCommand against backslash-escaped quotes (finding 1)", "owner": "developer"},
    {"item": "Orchestrator opens the PR; user confirms the hook fires in a real cell after applying settings", "owner": "orchestrator"}
  ]
}
```
