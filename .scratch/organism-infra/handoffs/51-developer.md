```json
{"ticket": "organism-infra/51-handoff-validates-at-publish", "cell": "developer", "current_step": "WIP implementation verified: all 51 tests pass except one wrong qa test; blocked on qa fixing it",
 "artifacts": ["apps/organism-infra/board-service.mjs", "scripts/cell-start.mjs", "scripts/log-cell.mjs", "scripts/usage.mjs", "scripts/log-cell-model.test.mjs", "scripts/usage-rows.test.mjs", "scripts/verdict-roles.test.mjs", "scripts/verdict-lock-failures.test.mjs"],
 "decisions": ["No code changes this session: the WIP at f313ef7 already satisfies the tests", "Did not edit qa's test; stopped per genome"],
 "failures": ["apps/organism-infra/board-handoff-validate.test.mjs 'a filled-in handoff satisfies the release gate' claims qa specify then releases at in-review; board-service.mjs:967 deliberately refuses that (only qa verify may release at in-review), so the test can never pass"],
 "pending": [{"item": "fix the test: release the qa specify claim with --status ready-for-agent (or claim as developer / qa verify); then re-run", "owner": "qa"}]}
```

## Summary

Branch organism-infra/51-wip @ f313ef7 (unchanged). Ran the 51 tests plus the four log-cell callers: 118 of 119 pass. Full npm test with PW_CHROMIUM_PATH set: only two failures, the wrong qa test above, and smoke:ui (environmental, Google Fonts cert).

The failing test is a test bug, not an implementation bug: the qa-in-specify release-at-in-review rule predates this ticket (ticket 18 security fix). Suggested fix is to change the release status in that test or the claim mode.
