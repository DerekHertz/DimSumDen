# 32-qa-specify

**Cell:** qa | **Mode:** specify | **Ticket:** organism-infra/32-cloud-usage-estimate

```json
{
  "ticket": "organism-infra/32-cloud-usage-estimate",
  "cell": "qa",
  "mode": "specify",
  "current_step": "tests committed and pushed; red confirmed",
  "artifacts": ["branch organism-infra/32-tests @ 7dabe25", "scripts/usage-estimate.test.mjs"],
  "decisions": [
    "Interface invented where ticket is silent: USAGE_LOG env names the usage.jsonl path (default .scratch/usage.jsonl); readings are rows with numeric cloud_credits, cloud_credits_est rows ignored",
    "weighted_tokens = all transcripts all time; tokens_per_credit = weighted tokens in [first reading, last reading] / credit drop; credits_used_est = weighted tokens after last reading / tpc",
    "context.mjs root cause is unverified (my probe of ~/.claude/projects was denied by the classifier). Tests pin the hypothesis: pick transcript by CLAUDE_CODE_SESSION_ID, searched across all project dirs, since cwd may be a worktree"
  ],
  "failures": ["Bash ls of /root/.claude/projects denied by auto-mode classifier (PII); did not retry"],
  "pending": [
    {"item": "Developer: implement scripts/usage-estimate.mjs, usage.mjs cloud fallback, context.mjs fix", "owner": "developer"},
    {"item": "Confirm context.mjs root cause in a real cloud session; adjust tests if it differs", "owner": "orchestrator"},
    {"item": "usage-watch skill diff (gated .claude/ edit)", "owner": "orchestrator"}
  ]
}
```

## Criterion-to-test map (all in scripts/usage-estimate.test.mjs)

1. Estimate matches hand-computed value: "estimate matches the hand-computed value..." (11000 weighted, 800 tokens/credit, used 2.5, left 47.5).
2. No readings: "with no readings it prints weighted tokens and a null credit estimate", plus "a missing usage log behaves like no readings".
3. usage.mjs falls back in cloud / unchanged locally: "usage.mjs falls back to the estimate..." and "usage.mjs is unchanged locally...".
4. context.mjs in cloud: "context.mjs reports this session's context via CLAUDE_CODE_SESSION_ID..." and "...when cwd is a worktree with no project dir of its own".
5. usage-watch skill diff: human-verified (gated .claude/ edit, reviewed by the user).

Credit calibration is covered only by the fixture math; kept optional per the scope note.

## Red confirmation

Run `node --test scripts/usage-estimate.test.mjs`: 6 fail, 1 passes. Failures: MODULE_NOT_FOUND for usage-estimate.mjs (3), usage.mjs exits 1 "could not read credentials" (1), context.mjs picks the wrong or null session (2). The passing one is the local-unchanged regression guard.
