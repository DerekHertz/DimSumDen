# Handoff: organism-infra/12 (developer)

**Branch:** `claude/organism-infra-12-tests` @ 7b11c9a (base: main @ 5eb06a6)
**PR:** https://github.com/DerekHertz/agent-office/pull/19 (pushed, CI green: `test` and `security` both pass, ~1m9s)

## What changed (`apps/organism-infra/board-service.mjs`, `board.mjs`)

1. **Comment forging** - `sanitizeCommentText()` indents every line after the
   first in comment free text before it's embedded in the stamp line, so an
   embedded `\n- **security, <date>:** ...` can never start at column 0 (the
   shape `STAMP_RE` requires). Applied in `comment()`.
2. **`--as`/unknown flags** - `board.mjs`'s `comment` case now rejects any
   `--`-prefixed arg outright (`BoardError`, nonzero exit) before calling
   `comment()`, so a rejected call never touches the ticket.
3. **TOCTOU containment** - `assertWithinRoot(root, paths.issuesDir)` is now
   re-run inside the write-lock callback, right before touching the ticket,
   in `claim`, `release`, and `comment`. Closes the gap where the lock-wait
   sleep gives an attacker room to retarget a symlink after the first
   (pre-lock) containment check passed.
4. **Tombstone hygiene** - `sweepOrphanedReclaimFiles(lockPath)` runs
   whenever `acquireWriteLock` creates the lock fresh (no live lock blocked
   it), deleting any `<lockPath>.reclaim-*` siblings - they can't belong to
   a live reclaim if nothing needed reclaiming.

## Test results

- `apps/organism-infra/board-comment-hardening.test.mjs`: 5/5 pass, including
  the symlink/TOCTOU test - it *skips* (reports ok without exercising the
  race) on this Windows sandbox per its own documented privilege gap, same as
  `board-cli.test.mjs:372`.
- `node --test "apps/organism-infra/*.test.mjs"`: 39/39 pass (34 pre-existing
  + 5 new), no regressions.
- CI on Linux (where dir symlinks aren't privilege-gated) ran the real race:
  PR #19's `test` job passed, so criterion 2 is verified for real, not just
  skipped-as-pass.

An unrelated pre-existing failure, `apps/ci-cd/smoke.test.mjs` ("npm run
smoke..."), showed up in a full local `npm test` run; it's outside this
ticket's files (board-service/board.mjs untouched by it) and not something
this branch introduced.

## Comments

None outside the ticket's checklist - all three criteria plus the added
`--as`/flag scope are covered by the qa-written tests, and CI confirms the
symlink race closes on a real symlink-capable environment.

Status left at `in-review` per the code-ticket relay; next is qa verify then
security review before the orchestrator proposes the merge.
