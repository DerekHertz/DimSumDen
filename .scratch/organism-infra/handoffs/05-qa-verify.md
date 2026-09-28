# 05-qa-verify: worktree-gc.mjs verified, PASS

**Cell:** qa | **Mode:** verify (light -- I ran specify for this ticket)
**Ticket:** `.scratch/organism-infra/issues/05-dispatch-into-existing-branch.md`
**Branch:** `claude/organism-infra-05-tests` @ `21bdf02` (PR #17)
**My specify commit:** `81161aa`

## Verdict: QA pass

## What I checked

1. Took a detached checkout of the exact developer SHA: `git checkout --detach 21bdf02` in the worktree, per the orchestrator's dispatch instructions for review cells.
2. Ran the scoped test suite: `node --test scripts/worktree-gc.test.mjs` -> **9/9 pass**, 0 fail, 0 skipped (confirmed independently twice: once directly, once via a scout agent running in the same checkout).
   - a dry run reports a clean, merged worktree as removable but deletes nothing
   - `--apply` removes a clean worktree whose branch is already merged into main
   - `--apply` keeps a merged worktree that has uncommitted changes, reports dirty
   - `--apply` keeps a locked worktree even when clean and merged, reports locked
   - `--apply` keeps a clean worktree whose branch is not yet merged, reports unmerged
   - `--apply` removes a clean detached-HEAD worktree once its commit is merged (reviewer-checkout shape)
   - `--apply` never removes or reports the main checkout itself
   - `--apply` ignores a merged, clean worktree outside `.claude/worktrees/`
   - without `--apply`, nothing is ever deleted even when every candidate is removable
3. Also ran the full suite (`npm test`): 105 tests, 104 pass, 1 fail -- the failure is `apps/ci-cd`'s "npm run smoke passes a dev page with no console errors..." test, unrelated to worktree-gc and already tracked in `ci-cd/03` per the orchestrator's dispatch note. Not a bounce reason for this ticket.
4. Diffed my specify commit against HEAD: `git diff 81161aa 21bdf02 --stat -- scripts/worktree-gc.test.mjs` -> **no output** (test file untouched, byte-identical). No assertions were weakened, loosened, or deleted.
5. Confirmed scope: `git diff 81161aa 21bdf02 --stat` -> only `scripts/worktree-gc.mjs` changed (157 insertions, 1 file). No other files touched, consistent with the ticket's approved scope.
6. Read the implementation (`scripts/worktree-gc.mjs`). It matches the CLI documented in the specify handoff (`--root <repoRoot> [--apply]`): refuses to run unless `--root` is the main checkout (lines 108-114), restricts candidates to worktrees under `<root>/.claude/worktrees/` (lines 118-124), and dispositions each candidate as locked/dirty/unmerged/removable before any delete, deleting only on `--apply` + removable.

## Acceptance criteria status

| Criterion | Status |
|---|---|
| Worktree lifecycle: which worktrees are kept, when removed (gc reports/removes based on merge+clean state; removal in general asks the user first per protocol) | **Tested, pass** -- 9 tests above |
| A fix round and a qa verify run can each start on an existing branch without denied commands / `reset --hard` | human-verified (protocol/orchestrator dispatch behavior, not testable against this script) |
| Review cells can run the branch's tests read-only | human-verified (same) |
| Genome or protocol changes proposed to the user (brain gate) | human-verified (process step, not code) |

These three were already marked human-verified in my specify handoff (`.scratch/organism-infra/handoffs/05-qa-specify.md`) since they're process/genome changes outside what `worktree-gc.mjs` can encode. Nothing in the developer's diff changed that scoping.

## Known, out-of-scope issue

The ci-cd smoke-test failure noted by the orchestrator is pre-tracked in `ci-cd/03` and unrelated to this ticket's scope (`scripts/worktree-gc.mjs` only). Not a bounce reason here.

## Next

Security review, then orchestrator merge decision (brain gate -- ask the user before merging PR #17).
