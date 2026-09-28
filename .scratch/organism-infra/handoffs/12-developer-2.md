# 12: fix round 2 (security bounce 1) -- developer

Branch `claude/organism-infra-12-tests`, now at `73897d3` (pushed, PR #19). CI green: `security` pass (14s), `test` pass (1m34s).

## What changed
Addressed all four items from `.scratch/organism-infra/handoffs/12-security.md`, in `apps/organism-infra/board-service.mjs`:

1. **High -- comment-stamp forging via CR/U+2028/U+2029.** `sanitizeCommentText` split only on `"\n"`, but `STAMP_RE`/`STATUS_LINE_RE` use JS multiline `^`/`$`, which also treats CR, CRLF, U+2028 and U+2029 as line terminators. Now splits on `LINE_TERMINATOR_RE = /\r\n|[\n\r  ]/`. Test: one case per terminator in `board-comment-hardening.test.mjs`.
2. **Deadline enforcement after self-reclaim.** `acquireWriteLock`'s `continue` after a successful `reclaimStale` bypassed the deadline check entirely; a lock that keeps coming back stale could loop past `WRITE_LOCK_WAIT_MS` without ever giving up. Now checks `Date.now() >= deadline` right after a successful reclaim too.
3. **EPERM/EBUSY/EACCES retry on the reclaim unlink.** New `unlinkWithRetry`, same shape as the existing `renameWithRetry`/`RETRYABLE_RENAME`/`RENAME_RETRY_MS`; `reclaimStale` now calls it instead of a bare `unlink`.
4. **NODE_ENV gate on BOARD_TEST_\*.** New `TEST_HOOKS_ENABLED = process.env.NODE_ENV !== "production"` gates `testHook`, `testHoldStart`, `testHoldEnd`, and the two new test-only seams added to make (2) and (3) deterministically testable.

New test-only seams (all gated by `TEST_HOOKS_ENABLED`, flagged and accepted as proportionate by the spec sub-agent -- see below): `BOARD_TEST_WRITE_LOCK_WAIT_MS` (shrinks the wait bound so the deadline test doesn't burn multiple real seconds), `BOARD_TEST_FORCE_UNLINK_ERR`/`_COUNT` (injects a transient unlink error N times), and a `post-reclaim` hook point (pauses right after a successful reclaim, before the deadline re-check).

Tests: 4 new terminator cases in `board-comment-hardening.test.mjs`; new `board-lock-hardening.test.mjs` (7 cases: deadline-after-reclaim, EPERM/EBUSY/EACCES retry x3, non-retryable-error control, NODE_ENV=production gate, and a control that the seam still works outside production). Full suite: 122/122 (`npm test`), organism-infra subset 50/50.

## Code review (self-run, both sub-agents came back clean)
- **Standards:** one judgement-call smell -- `renameWithRetry`/`unlinkWithRetry` share an identical retry-loop shape (Duplicated Code); acceptable at this scope with only two call sites. No other findings.
- **Spec:** all four items implemented correctly, nothing missing, nothing implemented wrong. Flagged the three new test seams as scope additions but judged all proportionate given they're the only way to deterministically test (2)/(3); called `BOARD_TEST_WRITE_LOCK_WAIT_MS` "worth a second look" since it makes the wait bound itself overridable (a different risk class than fault injection/logging), but not a blocker given it's gated the same way as everything else. No action taken beyond noting it here for the next security pass.

## Status
Releasing at `in-review` per protocol (developer doesn't resolve). Next: security re-review.
