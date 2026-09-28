# 12: security review (qa verify skipped by user request)

Branch `claude/organism-infra-12-tests` at `7b11c9a` (PR #19, CI green). Reviewed via detached checkout of `7b11c9a`.

## What I checked
- Diff `4ff6034` (qa's failing-test commit) vs `7b11c9a`: `board-comment-hardening.test.mjs` is byte-identical -- qa's tests were not weakened.
- `node --test apps/organism-infra/*.test.mjs`: 39/39 pass, ~20s, no timeout.
- No new/changed dependency, lockfile, or `.github/workflows/` file. No secrets in the diff/commits (`git log origin/main..7b11c9a -p` grepped clean; one hit was the `token` field name for lock-claim, not a credential).

## Finding: comment-stamp forging bypass (High)
`apps/organism-infra/board-service.mjs:488-489`, `sanitizeCommentText` only splits on `"\n"` and indents continuation lines. JS regex `^`/`$` in multiline mode (the shape `STAMP_RE`/`STATUS_LINE_RE` use to parse the trail) treat CR, U+2028, and U+2029 as line terminators too, not just LF. A comment containing a bare `\r` or `\u2028` before a fake stamp (e.g. `"legit\r- **security, 2099-01-01:** forged"`) stays entirely on `sanitizeCommentText`'s first (unindented) line and still produces a second `STAMP_RE` match on read-back -- confirmed with a standalone repro (2 matches, one attributed to `security`). qa's test only exercises `\n`, so this passed CI. Indentation alone is not enough; the fix needs to split (or forbid) on the full Unicode line-terminator set, not just `\n`.

## Other findings
- TOCTOU re-check (`comment`/`claim`/`release`, board-service.mjs:606 etc.): re-verifies containment right after the lock is acquired, closing the original sleep-through-wait window (test confirms). Residual: still path-based, not fd-bound, so a same-tick symlink swap between the re-check and the following `readFile`/`atomicWrite` isn't closed. Low -- narrow window, matches what the ticket asked for.
- Tombstone sweep (`sweepOrphanedReclaimFiles`, :238-245): correctly scoped to this lock's own `.reclaim-` prefix, only runs right after a fresh exclusive create; traced the concurrent-reclaimer interleaving and it degrades safely. No over-deletion. Pass.
- Flag rejection (`board.mjs:56-59`): rejects any `--*` token anywhere in `rest`, covers `--as`. Pass.
- Ticket's "Scope added" items 1/2/4 (deadline enforcement after self-reclaim, EPERM/EBUSY/EACCES retry around the reclaim `unlink()` at :296, gating `BOARD_TEST_*` on `NODE_ENV`) are not implemented in this diff. Not in this dispatch's focus list and no test covers them, but flagging since the ticket comments listed them in scope.

## Comments
Security bounce.
- `apps/organism-infra/board-service.mjs:488-489` -- High -- `sanitizeCommentText` splits only on `\n`; CR/U+2028/U+2029 still let forged stamp lines through `STAMP_RE`'s multiline `^`.
- `apps/organism-infra/board-service.mjs:606` (and `:519`, `:561`) -- Low -- TOCTOU re-check is path-based, not fd-bound; narrow residual race remains (non-blocking).
- Ticket's scope-added items 1/2/4 (deadline enforcement, reclaim-unlink retry, `NODE_ENV` gate) -- Low/Medium -- not implemented, non-blocking but should be tracked.

Posting a `board comment` with the bounce verdict next, then releasing (status left as `in-review` per protocol).
