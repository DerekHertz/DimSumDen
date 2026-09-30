```json
{"ticket": "organism-infra/77", "cell": "developer", "current_step": "Done, in-review: security-bounce fix 9314bd6 on dev/77-shared-exposure-module; npm test 969/969.",
 "artifacts": ["scripts/jev.mjs", "scripts/exposure.test.mjs"],
 "decisions": [
   "codeWakes now code-wakes when author is null/undefined as well as unknown: `author == null || !CELL_TYPES.includes(author)` (security Q1 ruling: decide() is the last line of defense).",
   "qa's wake happy-path test now passes `author: \"qa\"`; security required this test change explicitly (handoffs/77-security.md).",
   "New regression test: a wake with author undefined or null makes zero transport calls."],
 "failures": [],
 "pending": [
   {"item": "light verify of 9314bd6 (note: exposure.test.mjs changed this round by security's instruction, so 'test file unchanged since f05777f' no longer holds)", "owner": "qa"},
   {"item": "security re-review of the one-line diff", "owner": "security"},
   {"item": "orchestrator.md 'always exits 0' wording (security Q2), needs user permission", "owner": "orchestrator"}]}
```

## State
Done. Released at `in-review`.

## What changed
Branch `dev/77-shared-exposure-module`, commit `9314bd6` on top of `62ace3b`. Two files, +21/-1.
- `scripts/jev.mjs` `codeWakes`: `author !== undefined && !CELL_TYPES.includes(author)` became `author == null || !CELL_TYPES.includes(author)`.
- `scripts/exposure.test.mjs`: the wake test "includes new comment but not handoff text" passes `author: "qa"`; new test "wake: a comment with no author produces zero transport calls" loops over `undefined` and `null`.

## Verification
- The new test failed before the fix (`author undefined: transport must not be called`, 1 !== 0) and passes after.
- `npm test`: 969 tests, 969 pass, 0 fail, 0 skipped (968 before plus the new one).

## For the next cell
- qa: the test-file-unchanged check will show the two edits above; both come from the security bounce, not from the developer's own choice.
- Ticket 72 must pass a known cell type as `author` on every wake call; an internal caller should use e.g. `author: "orchestrator"`.

## Failed calls
- `board handoff ... --name 77-developer.md` exited 1: `board: handoff 77-developer.md was published under an earlier claim; refusing to overwrite`. Published as `77-developer-2.md` instead (precedent: dimsumden-ui-v0 `14-developer-2.md`). Genuine guardrail; the dispatch prompt should name a round-suffixed handoff for fix rounds.
- Grep tool with `path` set to a worktree file searched the main checkout instead (workspace root). Used `rg` via Shell in the worktree and Read on the absolute worktree path. Fixable friction (tool scoping), not a guardrail.

## Worktree receipt
Worktree: `/home/dhertzell/dsd-77-fix`, clean.
