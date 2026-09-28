# 16-qa-specify: failing tests for worktree-gc forgiveness and branch delete

**Cell:** qa | **Mode:** specify
**Ticket:** `.scratch/organism-infra/issues/16-worktree-lifecycle.md`
**Branch:** `claude/organism-infra-16-tests` (in worktree `agent-adb07b7d57f17fb9f`, off `main` @ `3a5655c`)
**Commit:** `03bd47b` (pushed to origin)
**Test file:** `scripts/worktree-gc.test.mjs` (appended to the existing suite from 05)

## Scope

This ticket has five acceptance criteria; only the three marked "(test)" are
code the developer relay can implement/test. Items 4 and 5 (orchestrator
genome removes reviewer worktrees at handback; organism-protocol handoffs-go-
to-main + receipt) edit `.claude/` and are the orchestrator's to do with the
user's permission per the ticket's own note ("Rules 2 and 5 edit .claude/").
Not tested here; left for the orchestrator.

## Criterion -> test map

| Criterion | Test |
|---|---|
| gc auto-removes a merged worktree whose only dirty files are byte-identical to main's (or `.claude/` local config) | "`--apply` removes a merged worktree whose only dirty files are untracked copies byte-identical to main's, or live under `.claude/`" |
| gc keeps and reports (one-line diff summary) a worktree with a unique change | "`--apply` keeps a worktree with a unique change and reports a one-line diff summary for it" |
| gc deletes the merged branch for the resolved ticket | "`--apply` deletes the branch of a merged worktree it removes" |

Added a fourth, adjacent test ("without `--apply`, a worktree with a unique
change is reported dirty but its branch is left alone") to pin down that a
dry run never deletes a branch either -- not one of the three named
criteria, but the natural boundary of criterion 3, so I'm flagging it rather
than silently adding scope.

## Assumed forgiveness rule (not confirmed with the user -- flag to developer)

The ticket doesn't spell out how to detect "byte-identical to main's", so I
documented and tested this assumption at the top of the new test block in
`worktree-gc.test.mjs`: a dirty file is forgivable if (a) it is untracked in
the worktree and its bytes exactly match the file at the same repo-relative
path in main's tree, or (b) its repo-relative path starts with `.claude/`,
regardless of content. A worktree whose only dirty files are forgivable is
then treated like a clean one (removable when merged). Any other dirty file
keeps the worktree dirty and its report line, and the report grows a
one-line diff summary. The developer should update this comment if they
pick a different detection rule.

## Run

`node --test scripts/worktree-gc.test.mjs` from the worktree
(`C:\claude_sessions\agent_office\.claude\worktrees\agent-adb07b7d57f17fb9f`)
or the main checkout. 14 tests total (9 pre-existing from ticket 05 plus 5
new/adjacent from this ticket): 11 pass, 3 fail. The 3 failures are exactly
the three named criteria's tests, and each fails on an assertion against
real (dis)position/branch-list output, not a crash:

- forgiveness test: `true !== false` on `existsSync(wtDir)` -- the worktree
  with only forgivable dirty files is still kept (not auto-removed), because
  the current script has no forgiveness logic at all, only clean/dirty.
- diff-summary test: report line is literally `merged-unique-change: dirty`
  with no filename or diff stat, so the "should name the file" match fails.
- branch-delete test: `true !== false` on `branchExists(...)` after
  `--apply` -- the branch is still listed because the current script never
  runs `git branch -d`.

All pre-existing 9 tests from ticket 05 still pass unmodified.

## Next

Developer implements the forgiveness check, the one-line diff summary in
the report, and branch deletion on removal in `scripts/worktree-gc.mjs` on
this branch (or a new one based on it), to turn these 3 red tests green,
then hands back for qa verify.

## Worktree receipt

Worktree: `C:\claude_sessions\agent_office\.claude\worktrees\agent-adb07b7d57f17fb9f`
Status: clean (all changes committed and pushed as `03bd47b` on
`claude/organism-infra-16-tests`; `git status --porcelain` empty).

## Failed calls

- `Bash`: `cd "C:/claude_sessions/agent_office" && git worktree list` -- error:
  "This agent is isolated in the worktree ... Refusing to run it". Guardrail
  working as intended (worktree isolation); reran from the worktree path
  instead without `cd`.
- `Edit`/`Write`: targeted
  `C:\claude_sessions\agent_office\scripts\worktree-gc.test.mjs` and
  `C:\claude_sessions\agent_office\.scratch\organism-infra\handoffs\16-qa-specify.md`
  (the shared checkout path) -- error: "Edit the worktree copy of this file
  instead of the shared-checkout path." Guardrail working as intended for
  the test-file case; retried with the worktree's own path and it succeeded.
  For the handoff file, this is the sanctioned exception in
  organism-protocol (a worktree cell writes its handoff to the main checkout
  via shell), so it's copied there with `cp` instead of `Write`.

## Comments

- human-verified: none needed for this ticket's code criteria; all three are
  automatable and covered above. Criteria 4 and 5 are `.claude/` edits owned
  by the orchestrator per the ticket's own text, not human-verified QA items.
