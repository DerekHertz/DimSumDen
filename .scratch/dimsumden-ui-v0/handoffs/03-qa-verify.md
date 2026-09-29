```json
{"ticket": "dimsumden-ui-v0/03-metrics-script", "cell": "qa", "mode": "verify", "current_step": "QA pass",
 "artifacts": [],
 "decisions": ["full verify done inline; npm test 414/414, 0 skipped"],
 "failures": [],
 "pending": [{"item": "security review", "owner": "security"}]}
```

# Handoff: qa verify, dimsumden-ui-v0/03-metrics-script

## State
QA pass. Branch feature/dimsumden-ui-v0-03-metrics at 99a4799.

## Checks
- `npm test` at 99a4799: 414 pass, 0 fail, 0 skipped.
- `git diff 0334cd4 HEAD`: only scripts/metrics.mjs added; scripts/metrics.test.mjs untouched, no assertion removed or loosened.
- Criteria: fixture gives four keys -> "fixture rows produce the four metric keys with the ADR values", "CLI --json over fixture files"; malformed lines skipped -> "malformed lines are skipped, not fatal"; text output -> "text output ... succeeds and is not empty". No human-verified items.
- Files outside scope: none.

## Notes (not bounces)
- Not tested: usage null with no usage row, extra free-text tool mappings, eventLines unused in v0 (both noted by specify and developer).
- TOOLS list duplicated from scripts/log-cell.mjs.

## Next step
security review.
