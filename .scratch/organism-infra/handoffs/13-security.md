# Handoff: organism-infra/13 (security)

**Verdict:** Security pass. Branch `claude/organism-infra-13-board-status-fix` @ a26e26a, diffed against origin/main 70276d0.

## What was reviewed
Full diff (board-service.mjs, board.mjs, board-fixture.mjs, two new test files, two real-ticket fixtures). No dependency or CI/workflow changes. No secrets in the diff (only legitimate lock-ownership `token` fields).

## Verified
- `npm test`: 96/96.
- `board-status-and-lock.test.mjs` + `board-reclaim-race.test.mjs` + `board-cli.test.mjs` run 5x: 34/34 each run, no flakes.
- `npm run risk-check`: 5 hits on board/lock files, escalation confirmed correctly.
- No lingering processes after test runs.

## Invariant argument critique (reclaimStale, board-service.mjs:251-290)
Sound. Mutex-per-stale-content serializes reclaimers; a live lock's file is never observed empty before its owner unlinks (open->link, never a bare create); a reclaimer that judged content S stale re-reads under the mutex and only unlinks if bytes are still S, so a lock that changed underneath it (another process's fresh live lock) is never stolen. Generation-cap exhaustion (8) fails safe: `reclaimStale` returns `false`, caller falls into its normal bounded backoff/retry, no spin. Crashed mutex-holder is skipped by dead-pid check (tested). PID-reuse-after-crash makes `isPidAlive`/`isReclaimable` fail toward *not* reclaiming (safe direction, pre-existing heuristic, not a regression here).

## Findings (none block; all low)
- `board-service.mjs:333-343` -- the deadline check is skipped on the `continue` taken after a self-successful reclaim. Practically bounded (a fresh lock can't be re-judged stale for 5s, and there's one lock file per ticket), but not structurally enforced. Recommend checking the deadline before `continue` too.
- `board-service.mjs:280` -- `unlink(lockPath)` inside the mutex-held branch isn't wrapped in the EPERM/EBUSY/EACCES-retry treatment used elsewhere (`tryCreateLock`, `renameWithRetry`). On Windows a delete-pending race here would surface as an uncaught hard failure rather than the graceful bounded path -- fails fast (no hang), just inconsistent with the rest of the module's Windows handling.
- `board-service.mjs:251-290` -- orphaned `.reclaim-<hash>-<g>` files can accumulate when generations are exhausted or content changes before cleanup; harmless (never resurrect a live lock) but a disk-hygiene item, same class as prior accepted residuals.
- `board-service.mjs:358-391` -- `BOARD_TEST_*` seam is inert unless both `BOARD_TEST_HOOK_DIR`+`BOARD_TEST_HOOKS`, or `BOARD_TEST_HOLD_LOG`, are set; worst case if leaked into a real environment is a bounded stall (`testHook` has its own 15s deadline, fails open) or stretched holds -- never a lock-bypass, and not remotely triggerable (env-var only). Recommend an additional `NODE_ENV !== 'production'` gate as the daemon becomes long-lived, for defense in depth.
- Lock ordering: confirmed unchanged and correct. `commitWithEvent` (events lock) is only ever called from inside `withWriteLock(paths.writeLockPath, ...)` in `claim`/`release`/`comment`; the reclaim mutex is internal to `acquireWriteLock` and touches no other named lock, so no new ordering-reversal path.
- Header-only status parse: regex is anchored to the header (before first `## `), matches real bold/plain formats, verified against real-ticket fixtures (02, 13) including inline mid-sentence "Status:" mentions in ticket 13's own prose (correctly not matched, since not line-initial). Theoretical edge: a ticket whose pre-`##` prose happens to *start* a line with literal "Status:" would still misparse; not present in any real ticket today.

Newline injection in comments (ticket 12 scope) not reviewed here, per dispatch.
