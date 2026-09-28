# 12: security re-review (fix round 2)

Branch `claude/organism-infra-12-tests` at `73897d3` (PR #19, CI green). Reviewed via detached checkout of `73897d3`.

## Prior High, re-checked
`board-service.mjs:488-489` (now with `LINE_TERMINATOR_RE`): `sanitizeCommentText` now splits on `/\r\n|[\n\r\u2028\u2029]/`, covering the full ECMAScript LineTerminator set that `STAMP_RE`/`STATUS_LINE_RE`'s multiline `^`/`$` recognize (LF, CR, CRLF, U+2028, U+2029) -- there is no fifth terminator in the spec, so this is complete. `board-comment-hardening.test.mjs` adds one case per terminator (CR, CRLF, U+2028, U+2029); all assert exactly one `STAMP_RE` match and that it isn't attributed to `security`. Fixed.

## 3 scope items from ticket 13 (ticket's Comments), re-checked
1. Deadline enforced after a successful self-reclaim (`acquireWriteLock`, ~L390-405): `continue` after reclaim now re-checks `Date.now() >= deadline` and throws `LockTimeoutError` if so. Covered by `board-lock-hardening.test.mjs` via the new `post-reclaim` hook + `BOARD_TEST_WRITE_LOCK_WAIT_MS` seam. Fixed.
2. `unlinkWithRetry` wraps the reclaim `unlink` in the same EPERM/EBUSY/EACCES bounded retry as `renameWithRetry`. Tested per error code plus a non-retryable-error control. Fixed.
3. `BOARD_TEST_*` seams gated behind `TEST_HOOKS_ENABLED = NODE_ENV !== "production"`. Tested (prod suppresses `BOARD_TEST_HOLD_LOG`; non-prod control still logs). Fixed as literally scoped. Note (Low, non-blocking): no script in the repo sets `NODE_ENV=production` for `npm run board` or the daemon, so today's default posture leaves the seams live; that's a deploy-config gap, not a code defect, and matches exactly what the ticket asked for.

## New seam: `BOARD_TEST_WRITE_LOCK_WAIT_MS`
Overrides the write-lock wait bound, gated by the same `TEST_HOOKS_ENABLED`. Not reachable without env-var control over the process, which already implies broader compromise; consistent with the existing `BOARD_TEST_HOLD_MS`/`BOARD_TEST_HOOKS` pattern. No new attack surface beyond what NODE_ENV-gating already accepts. Pass.

## Regression check
`git diff 4ff6034 73897d3 -- apps/organism-infra/board-comment-hardening.test.mjs`: 36 insertions, 0 deletions -- qa's original assertions untouched, only new cases added. No weakening.

## Tests run
`node --test apps/organism-infra/*.test.mjs`: 50/50 pass, ~19.5s, well inside timeout.

## Comments
Security pass.
