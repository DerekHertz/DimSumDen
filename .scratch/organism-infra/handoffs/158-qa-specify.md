```json
{"ticket": "organism-infra/158-work-never-one-machine", "cell": "qa", "mode": "specify", "current_step": "failing acceptance tests committed on tests/158-work-never-one-machine (80d1d9b); developer next",
 "artifacts": ["apps/organism-infra/board-release-push.test.mjs", "scripts/session-check.test.mjs", "scripts/session-check-fixture.mjs", "scripts/next-session-check.test.mjs"],
 "decisions": ["release skips the push when the repo has no origin remote (keeps ~40 origin-less board tests valid)", "session-check CLI pinned as scripts/session-check.mjs [--root], npm script session-check", "non-git root passes the check (existing next-session tests use plain temp dirs)", "branch in a handoff is read from prose: Branch `name`; latest handoff = highest mtime among <NN>-*.md", "claimed counts as in-progress (STATUSES has no in-progress)"],
 "failures": [],
 "pending": [{"item": "make the tests pass: board release push, scripts/session-check.mjs, next-session wiring, package.json script; write the exact .claude/ edits for the board-only push rule into the developer handoff", "owner": "developer"}]}
```

# Handoff: 158 qa specify

Branch `tests/158-work-never-one-machine`, commit 80d1d9b, base d807a1f. Not pushed by me (release will push it once implemented).

## Criterion to test map

1. Release pushes, then records: `apps/organism-infra/board-release-push.test.mjs` "release pushes the branch ..." and "release --keep-status (qa specify) pushes the tests branch too" (local bare remote).
2. Failed push refuses, keeps lock: same file, "a rejected push ..." (pre-receive hook, retry succeeds after fix) and "an unreachable origin ...".
3. Detached HEAD: same file, "a detached HEAD does not push and still releases" (passes today as a regression guard).
4. End-of-session check, three conditions with fix commands: `scripts/session-check.test.mjs` (blocks A main ahead, B board files dirty, C in-flight ticket branch missing or behind; plus clean, non-git, outside-.scratch, resolved-ignored, latest-handoff, all-at-once).
5. next-session runs the same check: `scripts/next-session-check.test.mjs`.
6. Handoff contains the exact `.claude/` edits for the board-only push rule: human-verified. This is the criterion that depends on the gated `.claude/` edit (orchestrator genome and organism-protocol wording); the developer writes the edit into its handoff, the user applies it.

Also pinned (not an acceptance criterion): no-origin repo skips the push ("a repo with no origin remote ...").

## Decisions made

See State block. Interface pins are documented in the header comment of each test file.

## Open points for the orchestrator or developer

- "The handoff step" in ticket part 2 is not tested: no seam is named. I did not pin `board handoff` refusing, because cell handoffs run in worktrees where "local main ahead" is meaningless. Suggest wiring session-check into the handoff skill wording (gated `.claude/` edit) instead.
- Dirty top-level `.scratch/usage.jsonl` (tracked, always modified) is not pinned either way; the check should probably count only `.scratch/<feature>/` dirs, as tests assume, else next-session always refuses in this repo.
- Release by a cell on `main` (orchestrator) is unspecified; tests only cover a worktree branch. Developer should decide, preferably never pushing main from release.
- Test-only helper `scripts/session-check-fixture.mjs` has no `.test.mjs` suffix, so `npm test` skips it as a test.

## Next step

Developer makes the new tests pass without editing them.

## Suggested skills

tdd, implement.

## Gotchas

Failing-for-the-right-reason state: release-push tests 1 to 4 fail on missing remote ref or non-refusal; session-check tests fail on "Cannot find module scripts/session-check.mjs"; next-session-check refusal tests fail because it still prints the launch command. Tests 5 and 6 in board-release-push and the clean next-session test pass today by design.
