# 32 qa verify (light)

QA pass. Branch organism-infra/32-usage-estimate at 5b6bcbb, detached worktree.

```json
{
  "ticket": "organism-infra/32-cloud-usage-estimate",
  "cell": "qa",
  "mode": "verify",
  "current_step": "done: light verify pass",
  "artifacts": ["scripts/usage-estimate.test.mjs (7 tests, 7 pass)"],
  "decisions": ["Failing browser smoke tests 17-20, 24 are expected in cloud; not counted against the branch"],
  "failures": ["npm test: 802 pass, 5 fail (all smoke/browser), 0 skipped"],
  "pending": [{"item": "user applies usage-watch skill diff from developer handoff (gated .claude/ edit)", "owner": "user"}]
}
```

## Steps
1. npm test: 807 tests, 802 pass, 5 fail, 0 skipped. Failures: smoke --url x3, smoke:ui, smoke (browser; expected in cloud). usage-estimate.test.mjs alone: 7/7 pass.
2. git diff 7dabe25 HEAD on scripts/usage-estimate.test.mjs: empty. No test weakened.
3. Criterion map:
   - estimate matches hand-computed: "estimate matches the hand-computed value..."
   - no readings, null credit: "with no readings..." and "a missing usage log..."
   - usage.mjs falls back in cloud, unchanged locally: two usage.mjs tests
   - context.mjs in cloud: the two context.mjs tests (session id, worktree cwd)
   - usage-watch skill diff: human-verified (in developer handoff, not on branch)
4. Files touched: scripts/context.mjs, scripts/usage-estimate.mjs, scripts/usage.mjs. All in scope.
