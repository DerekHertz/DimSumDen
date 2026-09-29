# 32-developer

```json
{
  "ticket": "organism-infra/32-cloud-usage-estimate",
  "cell": "developer",
  "current_step": "implemented, tests green, pushed, in-review",
  "artifacts": [
    "branch organism-infra/32-usage-estimate",
    "scripts/usage-estimate.mjs",
    "scripts/usage.mjs",
    "scripts/context.mjs"
  ],
  "decisions": [
    "usage-estimate.mjs exports estimate() and prints JSON when run directly; usage.mjs imports it on missing credentials + CLAUDE_CODE_REMOTE",
    "Default usage log: USAGE_LOG, else (ORGANISM_ROOT or cwd)/.scratch/usage.jsonl",
    "context.mjs: CLAUDE_CODE_SESSION_ID selects the transcript across all project dirs; falls back to newest in the cwd slug dir when unset or not found",
    "Estimate reads only the cwd-slug project dir (as specified); in a worktree cwd it will see only that worktree's transcripts. Not changed: qa's interface fixes it"
  ],
  "failures": ["npm test: 5 browser smoke failures (17-20, 24), expected in cloud"],
  "pending": [
    {"item": "Apply usage-watch skill diff below (gated .claude/ edit)", "owner": "orchestrator"},
    {"item": "Consider whether estimate should sum all project dirs when run from a worktree", "owner": "orchestrator"},
    {"item": "qa verify, then security", "owner": "qa"}
  ]
}
```

## usage-watch skill diff (proposed, not applied)

Add to `.claude/skills/usage-watch/SKILL.md`, in the section on getting the reading (exact anchor to be chosen by the applier):

```diff
+In a cloud session (`CLAUDE_CODE_REMOTE` set) there is no credentials file, so
+`node scripts/usage.mjs` prints an estimate instead of the real window:
+`{"source":"estimate","weighted_tokens",...,"credits_left_est"}`. Use
+`credits_left_est` as the reading and log it as `cloud_credits_est` next to any
+manual `cloud_credits` reading. When it is null (fewer than two manual readings),
+use `weighted_tokens` for trend only. When the estimate nears 80% used, ask the
+user for a real credit reading; each new reading recalibrates it.
```

Note: usage-watch text was not read by me; adjust wording to its existing structure.
