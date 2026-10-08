# 208 security review

Security pass at 30bf95e (branch diff vs origin/main, 3 commits, 10 files).

```json
{
  "ticket": "organism-infra/208-cell-context-hook",
  "cell": "security",
  "current_step": "Security review done at 30bf95e: pass, no critical or high findings.",
  "artifacts": ["scripts/hooks/context-budget.mjs", "scripts/context-budget.json"],
  "decisions": ["Pass: no new dependency, no workflow change, gitleaks clean, npm audit clean"],
  "failures": [],
  "pending": []
}
```

## Checks
- gitleaks detect over origin/main..30bf95e: 3 commits, no leaks. (Real run, not a grep fallback.)
- npm audit --omit=dev: 0 vulnerabilities. package.json, package-lock.json, .github untouched.
- .claude/skills/organism-protocol/SKILL.md change arrived via the user-applied gated patch commit (30bf95e); wording only.

## Findings (all low, non-blocking)
- scripts/hooks/context-budget.mjs isTmpDraft: at the stop limit, Write/Edit is allowed to any path under /tmp, except paths inside the cell's cwd or HOME. path.resolve normalizes `..`, so no traversal out of /tmp. Residual: a pre-existing symlink under /tmp pointing into the repo would be written through. A cell cannot create one itself at the stop limit (Bash is refused), so low. Could be tightened to realpath the target.
- scripts/hooks/context-budget.mjs warnedBefore: marker files under ~/.claude/context-budget-warned/ are keyed by session_id and agent_id with non [\w.-] characters replaced, so no path traversal. They accumulate with no cleanup (low, hygiene). Concurrent first calls may both warn (harmless). Write failure falls through to warn, which is a safe direction.
- WRAP_UP_BASH log-cell entry: `node scripts/log-cell.mjs` takes only validated flags (ticket, cell, mode, model, tokens, ms, outcome, context, failures) and no file-path argument, and the simple-command check blocks chaining. Fine.
- Fail-open on unreadable context is by design (AC5), unchanged.

## Pending
None.
