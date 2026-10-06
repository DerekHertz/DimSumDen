# 168: Serialize full test runs so parallel cells stop producing flaky failures

**Type:** bug

**Priority:** P2

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** Relay with `max_concurrent_cells: 2`. On 2026-10-06, the 166 qa light verify and batch C's developer scout ran full `npm test` suites at the same time. The overlapping runs had 46 and 74 failures, mostly Playwright navigation timeouts and `smoke:ui` timeouts, while the same branch passed 2185 tests when it ran alone. The flaky failures caused a false qa bounce and a scout run that hit its timeout (user decision: file the ticket, 2026-10-06).

## What to build

1. Make `npm test` take a machine-wide lock (a lock file outside the repo's tracked files, for example under the OS temp directory) before it runs the full suite. A second run waits for the lock and prints one line saying it is waiting and for which holder (pid, worktree path). It does not fail.
2. The lock is released when the run ends, including on failure, SIGINT and SIGTERM. A stale lock whose pid is gone is taken over.
3. A bounded wait (for example 15 minutes) ends in a nonzero exit with a clear message instead of hanging forever.
4. Targeted runs (`node --test <file>`) take no lock.

Files: `package.json` (the `test` script), a small wrapper under `scripts/`, and its test.

## Acceptance criteria

- [ ] Two full runs started together run one after the other; the second prints a waiting line naming the holder (test with a stub suite)
- [ ] The lock is released on normal exit, on failure and on SIGTERM (test)
- [ ] A stale lock with a dead pid is taken over (test)
- [ ] The wait has a bound and exits nonzero with a message when it is reached (test)
- [ ] `node --test <file>` is unaffected
- [ ] Existing tests still pass

## Comments

- **orchestrator, 2026-10-06:** Filed after the 166 false bounce (user yes, 2026-10-06).
