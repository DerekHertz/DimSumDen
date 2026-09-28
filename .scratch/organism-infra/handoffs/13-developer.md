# Handoff: organism-infra/13 (developer)

**Branch:** `claude/organism-infra-13-board-status-fix` @ e526571, off origin/main 70276d0. Not pushed. Status left for the orchestrator: it holds the lock; ticket should go to `in-review`.

## What changed
- `apps/organism-infra/board-service.mjs`
  - `findStatus`/`readStatus`/`replaceStatus`: match `^(**Status:**|**Status**:|Status:)` at line start, only in the header (before the first `^## `). Replaces the value only, keeping label and spacing. A ticket with no header status line now throws on claim/release (file untouched, no event, no claim lock left).
  - `acquireWriteLock`: loop with a 2.5s deadline, full-jitter exponential backoff (20ms start, 400ms cap) via `timers/promises` sleep. Throws `LockTimeoutError` (exitCode 75). Unreadable or mid-write lock files count as held. Reclaim rules are unchanged (same host, dead pid, older than 5s). The only immediate retry is after we ourselves removed a stale lock, so no path spins.
  - Reclaim race: after the tombstone rename, the renamed content is compared with what we judged stale. If they differ (a racing reclaimer had already installed a fresh lock), it is restored with an exclusive `link`. Lock payload gains a random `token`, and release unlinks only if the file still holds our token.
  - `atomicWrite`: unique temp name (`<file>.<pid>-<hex>.tmp`), rename retried up to 1s on EPERM/EBUSY/EACCES.
  - `claim`: checks the claim lock before waiting on the write lock (fast fail), then re-checks under the lock. It creates the claim lock with `wx`, after validating the status line.
  - All mutations re-read the ticket inside the write lock (unchanged, verified).
- `apps/organism-infra/board.mjs`: exit code is `err.exitCode` (75) for lock timeout, 1 otherwise.
- `apps/organism-infra/board-fixture.mjs`: optional `content` param (additive; existing callers unchanged).
- New `apps/organism-infra/board-status-and-lock.test.mjs` (10 tests), plus fixtures `apps/organism-infra/fixtures/real-ticket-{02,13}-*.md`, copied verbatim from the board and normalized to LF on load.

## Existing tests changed
None. `board-cli.test.mjs` passes unmodified. Its live-lock tests use a 5s child timeout, and the 2.5s wait fits inside it.

## Verified (ran)
- New tests were red before the fix: 9 of 10 failed. The one that passed was the comments-guard case, which the old first-match happened to satisfy.
- `node --test` on both board files: 29/29. Concurrency test (claim, then 6 comments and 2 releases in parallel) ran 5 times, all green.
- `npm test`: 91/91, exit 0. Required `npm install` first (playwright missing in the worktree). The resulting `package-lock.json` churn was reverted.
- Review: self-review only. The /code-review subagents were skipped at the user's medium-effort setting, so qa verify should look hard.

## Open / for the orchestrator
- `events.jsonl` is protected only by the per-ticket write lock. Mutations on different tickets can race on `seq` or lose event lines. Needs a board-wide events lock or append-only writes.
- Security finding (1) from 02 (newline injection in comments) is still open.
- The real ticket 13 status line was not touched by this cell.

## Follow-up: events.jsonl race closed (bed71fb)
`appendEvent` now holds a board-wide lock, `.scratch/events.jsonl.write-lock.json` (same `acquireWriteLock`: bounded wait, reclaim rules, exit 75), for read-last-seq plus a whole-file temp write and rename. Lock order is always ticket then events, so no deadlock. I did not rely on the `a` flag: Windows has no atomic O_APPEND, and the rename means readers never see a torn line. Residual: if the events lock times out, the ticket edit has already landed without its event. With holds of a few ms this is very unlikely, but possible. New test: 10 processes on 10 tickets (comment/claim/release) give 10 events with seq 1..10 (6/6 runs green). `npm test` 92/92.

## Follow-up 2: residual closed (b954084)
Order is now ticket lock → events lock → write ticket (and claim lock) → append event → release both, via `commitWithEvent`. A timeout on either lock leaves nothing written. New test: with a live events lock held, `release` and `comment` exit 75 and leave the ticket and `events.jsonl` byte-identical. `npm test` 93/93.

## Follow-up 3: race-free stale reclaim (a26e26a), qa finding on `tombstoneStale`
`tombstoneStale` and its put-back `link` are gone; `reclaimStale` replaces them.

**Mechanism.** A reclaimer that judged lock content S stale creates a reclaim mutex `<lock>.reclaim-<sha256(S)[:16]>-<g>` exclusively. It writes a temp file first and hard-links it into place, so the mutex is never seen empty. Holding the mutex, it re-reads the lock. It unlinks the lock only if the bytes still equal S and S still meets the reclaim rules. It then deletes the mutex files.

**Invariant 1: at most one live process holds the mutex for S.** Generation g is created exclusively, so it has one creator. A process moves on to g+1 only after seeing g's holder is a dead pid on this host, and dead stays dead. Two live holders at g < g' are impossible: the g' holder saw g's holder dead. Mutex files are deleted only after S has left the lock path, and a holder after that point can remove nothing (see 2).

**Invariant 2: while the mutex holder has read S, the lock path keeps holding S until it unlinks.**
- S's owner is dead.
- Releasers only unlink their own token.
- Acquirers only `wx`-create at an empty path.
- Every other reclaimer of S needs the mutex.
- Reclaimers of different content S' read bytes that are not S' and do nothing.

So the unlink always removes S, never a live lock. S is unique (random token plus timestamp), so once S is gone it never comes back.

**All three-process interleavings (A, B, C over stale S):**
- Only one of A and B can hold S's mutex, so exactly one unlinks S. The other either waits or, once S is gone, re-reads and changes nothing.
- C either `wx`-creates at the empty path or waits on the new live lock.
- Any live lock L is removed only by its owner's token-checked release.
- Result: at most one holder at a time. This is the qa scenario (A stale-judged → B reclaims and holds → A resumes → C arrives), now forced by the test seam.

**Liveness.**
- A crashed mutex holder is skipped by generation, capped at 8; past that, the bounded wait times out with exit 75.
- A crash after the unlink but before cleanup leaves orphan mutex files. They are harmless, because S never returns.

**Also changed.**
- A `wx` create that fails with EPERM, EACCES or EBUSY counts as busy, for Windows files still pending deletion.

**Test seam.** It is env-gated in `board-service.mjs` and inert unless `BOARD_TEST_*` vars are set:
- `BOARD_TEST_HOOK_DIR` + `BOARD_TEST_HOOKS` pause at the `stale-judged` and `reclaim-gap` points.
- `BOARD_TEST_HOLD_LOG` / `BOARD_TEST_HOLD_MS` log and stretch holds.

Security may want to review the seam.

**Tests** (`apps/organism-infra/board-reclaim-race.test.mjs`):
- The A/B/C interleaving: it failed on b954084 plus hooks (holds overlapped) and passes now.
- A crashed-mutex-holder case.
- A stress run: 12 processes reclaim one stale lock, and the hold log shows no overlap.

All board tests passed 5 runs in a row (34/34). `npm test` 96/96.
