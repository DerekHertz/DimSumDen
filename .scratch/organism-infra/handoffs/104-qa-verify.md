```json
{"ticket": "organism-infra/104-board-lock-test-flakes", "cell": "qa", "mode": "verify", "current_step": "Full verify done: QA pass on fix/104-lock-test-flakes at d66527d. npm test 1834/1834, 0 skipped; 12-copy stress under 8 CPU hogs 0 failed runs.",
 "artifacts": ["apps/organism-infra/board-service.mjs", "apps/organism-infra/board-cli.test.mjs", "apps/organism-infra/board-status-and-lock.test.mjs", "apps/ui/src/overlay/floating-cards.test.mjs", "scripts/usage-provider.test.mjs", "apps/ci-cd/dev-server-bind.test.mjs"],
 "decisions": ["QA pass: both board lock tests keep their behaviour checks (age-floor test gains a lock-unchanged assertion; fail-fast test swaps a wall-clock bound for wait=60 s vs runner timeout=20 s, so a claim that waited would be killed and fail the not-timedOut assertion)", "No assertion removed or loosened except the replaced wall-clock bounds named above"],
 "failures": [],
 "pending": [{"item": "Risk-check decides on security. board-service.mjs (product code) gained a gated test seam BOARD_TEST_WRITE_LOCK_AGE_FLOOR_MS, same NODE_ENV!==production gate as BOARD_TEST_WRITE_LOCK_WAIT_MS", "owner": "orchestrator"}, {"item": "Follow-up ticket per developer: floating-cards before() hook fails when many vite servers cold-start at once; Ctrl+Enter, dev-server-bind and Codex fixes are timeout widenings, not reproduced root causes", "owner": "orchestrator"}]}
```

## State
QA pass. Branch fix/104-lock-test-flakes, commit d66527d. Verified in a detached worktree at that sha.

## Checks
- npm test: 1834 pass, 0 fail, 0 skipped (my own run, same numbers as the developer's /tmp/104-tests.txt).
- Stress (my script, scratchpad stress.mjs): 12 concurrent `node --test` copies of board-cli.test.mjs and board-status-and-lock.test.mjs with 8 CPU-burning processes: 0 failed runs of 12. The developer's stress runs (injected 3 s and 4.7 s startup delay) showed the fail-fast test failing before and passing after.

## Criterion map
- Two lock tests pass under parallel load: board-cli.test.mjs "a fresh write lock with a dead pid is not reclaimed before the age floor"; board-status-and-lock.test.mjs "a taken claim lock fails fast even while the write lock is held". Both pass in the full run and the stress run.
- Assertions still check the same lock behaviour: age-floor test still requires non-zero exit when not timed out, plus a new assertion that the lock file is unchanged. Fail-fast test still requires exit 1 and /already claimed/, and now asserts timedOut false (a waiting claim would be killed at 20 s versus a 60 s wait).
- npm test green: yes.

## Observations (not bounces)
- The age-floor test's pre-fix failure was never reproduced (developer says so); the fix follows from the mechanism, and the new unchanged-lock assertion runs on every path.
- Files touched outside the two named tests: apps/organism-infra/board-service.mjs (product code, test seam), apps/ci-cd/dev-server-bind.test.mjs, apps/ui/src/overlay/floating-cards.test.mjs, scripts/usage-provider.test.mjs. The last three are the triage flakes the ticket names; they are timeout widenings with reasons in comments. usage-provider hang-mode bound 3.5 s to 8 s still sits under the 10 s adapter default.

## Next step
Orchestrator: npm run risk-check (board-service.mjs touched), then PR.
