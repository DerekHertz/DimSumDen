# 05: Security re-review (round 2) — scripts/worktree-gc.mjs (PR #17, SHA d695045)

**Cell:** security
**Ticket:** organism-infra/05-dispatch-into-existing-branch (Status left at `in-review`)
**Branch reviewed:** claude/organism-infra-05-tests at d695045, via a detached checkout (`git checkout --detach d695045`) in this cell's worktree
**Prior finding:** handoffs/05-security.md — High: the "must be main checkout" guard (worktree-gc.mjs:108-114, added in 21bdf02) compared `--root` against `entries.some(...)`, which is true for any worktree path, not just the main checkout, since `git worktree list --porcelain` lists every worktree regardless of cwd.
**Fix reviewed:** handoffs/05-developer-2.md

## What I checked

- **The fix itself** (`git diff 21bdf02 d695045 -- scripts/worktree-gc.mjs`): the guard now reads `entries.length > 0 && normalizedAbsolutePath(entries[0].worktreePath) === rootResolved` (worktree-gc.mjs:114). This is exactly the fix I proposed: `git worktree list` always lists the main checkout first, and this is the same pattern `apps/organism-infra/board-service.mjs`'s `resolveRoot` (lines 60-77) already uses. The `entries.length > 0` guard also correctly fails closed if porcelain output is ever empty. No other logic in the function changed.
- **Regression test**: `worktree-gc.test.mjs` gained one new test, "--root pointed at a linked worktree (not the main checkout) is refused, and nothing is touched" — it builds a merged+clean linked worktree, runs the script with `--root` and `cwd` both pointed at that linked worktree, and asserts a non-zero exit, `"not the main checkout"` in the output, and that the worktree directory still exists. This exercises exactly the path the prior finding described (a cell running gc from inside its own worktree with `--root` defaulting to `process.cwd()`).
- **Test-diff scope**: `git diff 21bdf02 d695045 -- scripts/worktree-gc.test.mjs` shows only one added test block (33 lines), no deletions, no changes to any existing test or assertion. Confirmed by reviewing the full diff, not just the stat.
- **Full diff scope**: `git diff a5100bb d695045 --stat` — still only `scripts/worktree-gc.mjs` (+163) and `scripts/worktree-gc.test.mjs` (+322), matching the ticket's approved scope. No dependency, lockfile, or `.github/workflows/` changes.
- **Tests**: re-ran `node --test scripts/worktree-gc.test.mjs` at d695045 — 10/10 pass, including the new regression test. Matches the developer's and qa's numbers.
- **Secrets**: `git diff 21bdf02 d695045` grepped for key/token/password/PEM/AWS/GitHub-token/Slack-token patterns — no matches.
- **Command injection / other risk classes**: no new `execFileSync` call sites or argument patterns were introduced by this round; the fix is a pure comparison-logic change (`.some()` to `entries[0]` equality). Nothing reintroduces or is adjacent to the prior finding.

No new findings this round. The fix matches the prior review's suggested fix exactly, is covered by a test that the developer confirmed fails against the old code path (stash-and-revert check in 05-developer-2.md) and passes green now, and stays within the approved scope.

## Comments

- No findings this round. The High from round 1 (`scripts/worktree-gc.mjs:108-114`, non-functional main-checkout guard) is fixed: guard now compares against `entries[0]` and is covered by a new regression test. No secrets, no dependency changes, no CI/CD changes, scope unchanged (script + tests only).

## Verdict

Security pass
