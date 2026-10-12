# 220 security

Verdict: Security pass. Branch `tests/organism-infra-220-context-budget`, tip 63ea546, diff against origin/main.

```json
{
  "ticket": "organism-infra/220-one-context-budget-for-cells",
  "cell": "security",
  "current_step": "Reviewed the full diff against origin/main. Security pass, no findings at medium or above.",
  "artifacts": [],
  "decisions": [
    "risk-check gave 4 hits, not the 2 the developer reported. Two are the .claude/** edits (commit 63ea546, the user's own 'Apply gated patch' commit); two are the test files.",
    ".claude/agents/orchestrator.md and .claude/skills/organism-protocol/SKILL.md: prose-only changes (budget numbers). No permissions, tools, hooks or settings touched. The commit is the user's apply-gated step.",
    "scripts/context-budget-220.test.mjs: spawnSync('node', [fixed repo path]) with a tmpdir fixture and a fixed argv array, no shell, no untrusted input. Benign.",
    "scripts/hooks/context-budget.handback.test.mjs: hit comes from 'board release' and similar strings used as test input to the hook. Only numeric thresholds changed. Benign.",
    "Product code (context-budget.mjs, context-budget.json, statusline.mjs): reads a local JSON config (env seam CONTEXT_BUDGET_CONFIG, read-only, wrapped in try/catch, fails open), no network, no shell, no path built from untrusted text. statusline.mjs now imports budgetFor at module load; it never throws.",
    "The budget is cost control, not a security boundary. Raising the stop for security/architect/scout from 80k to 150k is the ticket's stated intent.",
    "No dependency, lockfile, workflow or branch-protection change. gitleaks over origin/main..63ea546: no leaks (3 commits scanned)."
  ],
  "failures": [],
  "pending": []
}
```

## Findings

None at critical, high, medium or low.
