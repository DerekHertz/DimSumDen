# Handoff: organism-infra/13 (qa full verify)

**Verdict:** QA pass.
**Branch:** `claude/organism-infra-13-board-status-fix` @ b954084 (off 70276d0, not pushed).

## What I ran
- `npm install` (playwright missing in worktree, same as developer noted; package-lock.json churn left as-is, no code changes).
- `npm test`: 93/93.
- `node --test board-status-and-lock.test.mjs board-cli.test.mjs`, 5x: 155/155, no flakes.
- Diffed `board-cli.test.mjs` against 70276d0: untouched, no existing coverage weakened.
- Grepped every real ticket header on the board (`.scratch/*/issues/*.md`) against the status regex: all match `**Status:**`.

## What I checked
- Lock ordering: `commitWithEvent` (only caller of the events lock) is only ever invoked from inside `withWriteLock(paths.writeLockPath, ...)` in `claim`/`release`/`comment` (board-service.mjs:402,441,480). No path reverses ticket-then-events order.
- Bounded-wait test determinism: the held-lock test holds the lock for the whole test and the deadline is a fixed 2.5s, so `elapsed >= 1000 && < 6000` is not timing luck.
- Timeout-changes-nothing, claim-lock-fast-fail, reclaim put-back, and Windows rename retries all reviewed and pass; rename retries exercised for real (this box is Windows).
- Concurrency tests assert real invariants (gapless seq, one write per success, prefix-preserved content), not just absence-of-crash.

## Finding (not an AC gap, recommend follow-up ticket)
`tombstoneStale` (board-service.mjs:224-238): between its tombstone rename and its mismatch-check/link-back there is a narrow window where a third concurrent process can `wx`-create a fresh lock at the now-empty path. The restore `link` then fails silently and the tombstone (a second racer's genuine live-lock content) is discarded, so two processes could both believe they hold the write lock. Only reachable via a 3-way race on a genuinely stale (crashed-process) lock; no current test hits it and no AC names it. Same class of accepted residual as the events.jsonl race the developer flagged earlier in this ticket.

## Comment posted
Full verdict and detail appended to `.scratch/organism-infra/issues/13-board-status-format-and-lock-wait.md` Comments (qa, 2026-09-27).
