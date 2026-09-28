# 05: Fix round 2 (security bounce 1) — developer

**Ticket:** organism-infra/05-dispatch-into-existing-branch
**Branch:** claude/organism-infra-05-tests, now at d695045 (PR #17), pushed
**Scope:** scripts/worktree-gc.mjs, scripts/worktree-gc.test.mjs (matches security's fix + test ask)

## What changed

Security (handoffs/05-security.md) found the "must be main checkout" guard
added in 21bdf02 non-functional: it checked
`entries.some(e => path === rootResolved)` against `git worktree list
--porcelain`, but that command lists every worktree of the repo identically
no matter which one you run it from, so the check passed for *any* worktree
path, not specifically the main one. Fails safe today (silent no-op, not a
bad delete) but defeats the guard's whole purpose.

Fix: worktree-gc.mjs:108-114 now compares `--root` against `entries[0]`
only — git always lists the main checkout first — the same pattern
`apps/organism-infra/board-service.mjs`'s `resolveRoot` (lines 60-77)
already uses.

Added a regression test in worktree-gc.test.mjs ("--root pointed at a
linked worktree (not the main checkout) is refused, and nothing is
touched"): builds a merged+clean worktree, runs the script with `--root`
set to that worktree's own path and cwd inside it, and asserts exit != 0,
"not the main checkout" in stderr, and the worktree directory untouched.

## Verification

- Confirmed red: stashed just the .mjs fix (reverting to the old
  `entries.some` check) and reran — the new test failed (9/10 pass), the
  other 9 stayed green. Restored the fix, dropped the stash; reran —
  10/10 pass.
- `node --test scripts/worktree-gc.test.mjs`: 10/10 pass.
- `npm test` (full suite): 105/106 pass. The one failure —
  "npm run smoke passes a dev page with no console errors..." (ci-cd) — is
  unrelated to this diff (outside scripts/worktree-gc.*, pre-existing, not
  touched by this change).

## Status

Pushed to PR #17 (d695045). Handing back to security for re-review per the
relay. Board ticket left at `in-review` (developer doesn't resolve on a
code ticket).
