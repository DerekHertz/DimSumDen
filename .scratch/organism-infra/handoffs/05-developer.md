# 05: developer handoff — scripts/worktree-gc.mjs

**Ticket:** `.scratch/organism-infra/issues/05-dispatch-into-existing-branch.md`
**Scope:** only `scripts/worktree-gc.mjs` (the other 3 ACs on this ticket — dispatch onto existing branch, read-only review cells, brain-gate genome proposal — are protocol/genome changes handled separately, per the ticket and qa's specify comment).

**Branch:** `claude/organism-infra-05-tests`, pushed. PR: https://github.com/DerekHertz/agent-office/pull/17
**Started from:** commit `81161aa` (qa's failing acceptance tests, `scripts/worktree-gc.test.mjs`, 9 tests).
**Commits added:**
- `7460919` — initial implementation, all 9 tests passing
- `21bdf02` — code-review follow-ups (see below)

## What it does

`node scripts/worktree-gc.mjs [--root <repoRoot>] [--apply]`

- Lists worktrees under `<root>/.claude/worktrees/` via `git worktree list --porcelain`.
- For each: `locked` (git worktree lock) > `dirty` (`git status --porcelain` non-empty) > `unmerged` (HEAD not an ancestor of main's tip) > `removable`.
- Without `--apply`: dry run, reports dispositions, deletes nothing, exit 0.
- With `--apply`: removes only `removable` candidates via `git worktree remove`; everything else is left in place and reported. Exit 0 regardless (matches test expectations — this is a report, not a failure).
- Never touches the main checkout itself, or paths outside `.claude/worktrees/`.
- Now refuses to run (exit 1) if `--root` doesn't resolve to a checkout `git worktree list` actually lists — this was documented in the test file's header comment as a precondition but wasn't enforced in the first pass; added after the spec-review sub-agent flagged it.

## Verification

- `node --test scripts/worktree-gc.test.mjs`: 9/9 passing.
- `npm test` (full suite): all green except `apps/ci-cd/smoke.test.mjs` ("npm run smoke passes a dev page with no console errors..."), which fails with `ERR_MODULE_NOT_FOUND` — confirmed pre-existing by stashing this change and re-running against the unmodified base commit; same failure. Unrelated to this ticket, looks like a missing dependency/module in the ci-cd smoke harness, not something introduced here.
- Ran `/code-review` (Standards + Spec axes) against base `81161aa`. Standards findings (all addressed in `21bdf02`): match `risk-check.mjs`'s `main()`/`process.exit(main())` return-code pattern, name disposition strings as constants, and rename `resolveP` to `normalizedAbsolutePath`. Spec findings: no scope creep, no missing test-covered requirements; one soft spot (the `--root`-must-be-main-checkout precondition, untested but documented) — fixed as above. A note on `git worktree remove` not passing `--force` was left as-is (correct per spec: only pre-filtered clean/merged candidates ever reach that call).

## Environment issues

- `apps/ci-cd/smoke.test.mjs` fails on `main`/this branch's base independent of this change (`ERR_MODULE_NOT_FOUND` from `node:internal/modules/package_json_reader`). Worth a look separately; not touched here since it's out of scope for organism-infra/05.

## Next

Board ticket released at `in-review`. Orchestrator: review/merge PR #17, then the remaining 3 ACs on this ticket (protocol/genome changes) are still open and unclaimed.
