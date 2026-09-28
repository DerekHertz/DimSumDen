# 05-qa-specify: failing acceptance tests for scripts/worktree-gc.mjs

**Cell:** qa | **Mode:** specify
**Ticket:** `.scratch/organism-infra/issues/05-dispatch-into-existing-branch.md`
**Branch:** `claude/organism-infra-05-tests` (in worktree `agent-acee318b17c5ea1c4`, off `main` @ `a5100bb`)
**Commit:** `81161aa`
**Test file:** `scripts/worktree-gc.test.mjs`

## Scope

This ticket has four acceptance criteria, but only one is code the developer
relay can implement/test: "Worktree lifecycle... which merged or abandoned
worktrees are removed." Per the approved scope (Comments, 2026-09-27, item
2): `scripts/worktree-gc.mjs` removes clean agent worktrees whose HEAD is
already on main, and reports dirty or locked ones.

The other three criteria are process/genome/protocol changes, not testable
this way:
- "A fix round and a qa verify run can each start on an existing branch..." -- orchestrator dispatch behavior + permission classifier rules.
- "Review cells can run the branch's tests read-only" -- permission/protocol behavior.
- "Genome or protocol changes this needs are proposed to the user (brain gate)" -- a proposal step, not code.

Marking these three human-verified in Comments; they need a separate
proposal/decision, not a test file. If the orchestrator wants those broken
into their own tickets, that's a follow-up.

## Assumed CLI surface (not confirmed with the user -- flag this to the developer)

The ticket doesn't specify `worktree-gc.mjs`'s interface, so I designed one
consistent with `scripts/risk-check.mjs`'s conventions and documented it at
the top of the test file:

```
node scripts/worktree-gc.mjs [--root <repoRoot>] [--apply]
```

- Candidates = every `git worktree list --porcelain` entry under
  `<root>/.claude/worktrees/*`. The main checkout itself and worktrees
  elsewhere are never candidates.
- No `--apply`: dry run, reports disposition (removable/dirty/locked/unmerged), deletes nothing, exit 0.
- `--apply`: removes only candidates that are clean AND whose HEAD is an
  ancestor-of-or-equal-to main's tip (covers both a merged branch and a
  detached-HEAD reviewer checkout of a since-merged SHA). Dirty, locked, and
  unmerged candidates are left in place and reported. Exit 0 even when some
  are kept.

If the developer or orchestrator wants a different flag shape (e.g. a
subcommand instead of `--apply`), that's fine -- update this doc and the
test file's assumption comment to match, don't just skip the criterion.

## Criterion -> test map

| Criterion | Test(s) |
|---|---|
| Removes clean, merged worktrees | "`--apply` removes a clean worktree whose branch is already merged into main"; "`--apply` removes a clean detached-HEAD worktree once its checked-out commit is merged into main" |
| Reports (never deletes) dirty worktrees | "`--apply` keeps a merged worktree that has uncommitted changes, and reports it as dirty" |
| Reports (never deletes) locked worktrees | "`--apply` keeps a locked worktree even when it is clean and merged, and reports it as locked" |
| Never removes worktrees whose work isn't merged | "`--apply` keeps a clean worktree whose branch is not yet merged into main, and reports it as unmerged" |
| Never touches the main checkout | "`--apply` never removes or reports the main checkout itself" |
| Only acts on agent worktrees under `.claude/worktrees/` | "`--apply` ignores a merged, clean worktree that lives outside `.claude/worktrees/`" |
| Dry run reports without deleting | "a dry run reports a clean, merged worktree as removable but deletes nothing"; "without `--apply`, nothing is ever deleted even when every candidate is removable" |

## Run

`node --test scripts/worktree-gc.test.mjs` -- 9 tests, all fail on
`MODULE_NOT_FOUND` for `scripts/worktree-gc.mjs` (confirmed by running the
script directly: `Error: Cannot find module '...worktree-gc.mjs'`), not on a
fixture/setup bug. Each fixture is a real disposable git repo built with
`git init`/`worktree add`/`worktree lock`/`merge --ff-only`, torn down in
`finally`.

## Comments

- human-verified: the other three acceptance criteria on this ticket
  (dispatch onto an existing branch without denied commands, review cells
  running tests read-only, and the brain-gate proposal) are process/protocol
  changes, not testable against `worktree-gc.mjs`. They need their own
  verification path once the orchestrator decides how to scope them.

## Next

Developer implements `scripts/worktree-gc.mjs` on this branch (or a new one
based on it) to turn these 9 red tests green, then hands back for qa verify.
