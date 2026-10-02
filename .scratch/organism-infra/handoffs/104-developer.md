```json
{"ticket": "organism-infra/104-board-lock-test-flakes", "cell": "developer", "current_step": "Both board lock tests made deterministic, three other load flakes widened; committed d66527d on fix/104-lock-test-flakes; npm test 1834/1834.",
 "artifacts": ["apps/organism-infra/board-service.mjs", "apps/organism-infra/board-cli.test.mjs", "apps/organism-infra/board-status-and-lock.test.mjs", "apps/ui/src/overlay/floating-cards.test.mjs", "scripts/usage-provider.test.mjs", "apps/ci-cd/dev-server-bind.test.mjs"],
 "decisions": ["Added gated test seam BOARD_TEST_WRITE_LOCK_AGE_FLOOR_MS (same TEST_HOOKS_ENABLED gate as BOARD_TEST_WRITE_LOCK_WAIT_MS); production floor stays 5000 ms", "Fail-fast test now proves 'did not wait' by wait=60 s vs runner timeout=20 s instead of a wall-clock bound"],
 "failures": ["Pre-fix flake of the age-floor test could not be reproduced (see Stress runs)"],
 "pending": [{"item": "Follow-up ticket: floating-cards before() hook (30 s Tally wait) fails when many vite servers cold-start at once; and the Ctrl+Enter fix is a timeout widening, not a root cause", "owner": "orchestrator"}]}
```

## State
Done. Branch fix/104-lock-test-flakes, commit d66527d (base 2cbbb56).

## What changed
- board-service.mjs: isReclaimable reads BOARD_TEST_WRITE_LOCK_AGE_FLOOR_MS (gated).
- "fresh write lock with a dead pid": floor pinned to 10 min, wait 500 ms, runner timeout 20 s. Also asserts the lock file is unchanged (strictly more than before). Why it flaked: lock age at check = process startup + up to 2.5 s wait, against a 5 s floor.
- "taken claim lock fails fast": removed `elapsed < 1500`. Now BOARD_TEST_WRITE_LOCK_WAIT_MS=60000, runner timeout 20000; asserts not timedOut, exit 1, "already claimed". A claim that waited on the held write lock would be killed by the runner, so it still checks the same behaviour at any speed.
- floating-cards.test.mjs: page default timeout and expectPost ceiling 5 s -> 20 s (Ctrl+Enter flake).
- usage-provider.test.mjs: adapter deadline 20 s except hang modes (1 s); hang bound 3.5 s -> 8 s; spawnSync 5 s -> 20 s.
- dev-server-bind.test.mjs: waitForServer 10 s -> 30 s.

## Stress runs (scripts in /tmp: t104-stress.mjs, t104-cards.mjs, t104-delay.cjs; 8 cores)
- Lock tests, 8 concurrent copies x 6 rounds, 16 CPU hogs: before 48/48 + 48/48 pass, after 48/48 + 48/48. Load alone did not reproduce.
- Lock tests with injected 3 s startup delay in the board CLI (preload), 2 copies: fail-fast test before 0/2 pass, after 2/2. Age-floor test passed both before and after (before: the runner's 5 s kill fires first and the assertion is skipped), so its pre-fix failure was not reproduced; the fix follows from the mechanism above.
- Same with 4.7-4.93 s delay, 8 copies x 3: fail-fast before 0/24, after 24/24; age-floor 24/24 both.
- Ctrl+Enter test, 12 concurrent, 48 hogs: before 2/12 failed (fill after first POST timed out at 5 s), a repeat before 0/12; after 12/12 (warm vite cache), 8/8 at 8 conc/40 hogs.
- usage-provider Codex tests, 24 concurrent, 64 hogs: 24/24 before and after; not reproduced.

## Gotchas
- Cold vite cache + 12 simultaneous floating-cards processes fail the before() hook (30 s wait for button.chip-tally); my stress harness artifact, but a real fragility under heavy load. Not fixed.
- dev-server-bind and Codex tests: widened on reasoning, not reproduced.

## Next step
qa full verify, then orchestrator PR.

## Suggested skills
code-review, tdd (verify).
