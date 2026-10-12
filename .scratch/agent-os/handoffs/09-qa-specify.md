```json
{
  "ticket": "agent-os/09-main-git-write-rule",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed on tests/agent-os-09-main-git-write-rule (6bcf5bc). 61 of 75 tests in the three files fail for a missing feature; 14 pass (unchanged guards). agent-os/02 and 07 tests untouched and green (695/695).",
  "artifacts": [
    "branch tests/agent-os-09-main-git-write-rule at 6bcf5bc (specify sha), based on a86d59e",
    "apps/bridge/cells/main-git-rule.test.mjs (new)",
    "apps/bridge/cells/workspace.test.mjs (rewritten for detached worktrees; publish tests added)",
    "apps/bridge/cells/host-workspace.test.mjs (rewritten for detached; publish-at-end test added)"
  ],
  "decisions": [
    "PINNED INTERFACE is in the header of main-git-rule.test.mjs. Summary: compileCeiling(role, { mainGit }) adds denyAbs for <mainGit>/refs/**, HEAD, packed-refs, index (settings: denyWrite plain paths; Write and Edit rules `//<mainGit>/refs/**`, `//<mainGit>/HEAD` ...). Applies to ALL four ceiling roles including scout (the CLI opens the main .git for any worktree, and the ticket says every worktree task), with or without grants. Bad mainGit is a TypeError. objects and worktrees/ never named.",
    "workspace.mjs exports prepareMainGit(root, { exec }) -> { mainGit }: makes refs, HEAD, packed-refs (git pack-refs --all --no-prune) exist, rejects if still missing or .git is not a directory. Index: made to exist OR the spawn refused (test accepts either, never left missing). Second call runs no git.",
    "createWorkspaces(root).create runs `git worktree add --detach <dir> HEAD` (exact argv pinned); branch is still returned as the name to publish. New ws.publish({ dir, branch }) -> { branch, sha } creates the branch at the worktree HEAD, refuses an existing branch, refuses a name that is not a den/ branch. remove still deletes a published branch.",
    "Host passes args.mainGit = <realpath root>/.git on every spawn (grants or not, ceiling role or not), runs the preflight before the spawn, and calls publish when the agent ends (test: commit in the worktree, fake exit, branch appears at that sha, main HEAD unmoved).",
    "POST /tasks: ~/.bash_profile, ~/.bash_login, ~/.bash_logout, ~/.bash_aliases refused (400) for developer, qa, security, in ~/ and absolute home form; ~/bash_notes stays allowed."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Make the tests green: adapter (mainGit in compileCeiling), claude-runtime.mjs (pass mainGit through to compileCeiling), workspace.mjs (detach, prepareMainGit, publish), host.mjs (mainGit arg, preflight, publish on end), grant-policy.mjs RC_FILES (4 entries). Do not edit the specify tests.",
      "owner": "developer"
    },
    {
      "item": "Criterion 4, human-verified (not automated): repeat the live probe through the real createClaudeRuntime and record it on the ticket (every ref/HEAD/packed-refs/update-ref/branch/tag write refused, git commit succeeds, main HEAD and refs unchanged; run git gc --auto and git worktree add and record the output). Criterion 6: risk-check, gitleaks, full security review.",
      "owner": "developer"
    },
    {
      "item": "Not tested, flag for developer/security: a spawn refusal path through the host when the preflight rejects (status code left open; architect suggests 502). Also unspecified: whether publish runs for an agent that made no commit (branch at base HEAD).",
      "owner": "developer"
    }
  ]
}
```

# qa specify: agent-os/09

## Criterion to test map

1. Failing tests first
   - four denies per role, with and without grants: `main-git-rule.test.mjs` "compileCeiling with mainGit denies..." (scout, developer, qa, security x none, host grant, path elsewhere, path in checkout; shell and Write/Edit tools)
   - objects and worktrees stay writable; no mainGit means unchanged; bad mainGit is TypeError; mainGit not keyed on root
   - host passes mainGit with no grants: "the host passes mainGit for every task..."
   - preflight: "prepareMainGit makes every deny target exist, or refuses"
   - detached worktree from workspace.create: `workspace.test.mjs` (exact argv; real git: no current branch, HEAD equals root HEAD)
2. Rewritten assertions: `workspace.test.mjs` "create adds a detached worktree..."; `host-workspace.test.mjs` first test (porcelain `detached`, no den/ branch while running) and the failed-spawn title. Bridge creates the branch at the final commit: `workspace.test.mjs` publish tests (3) and `host-workspace.test.mjs` "the bridge creates the agent's branch at its final commit".
3. agent-os/02 and 07 unchanged: I touched none of their files; grants-paths, grants-hardening, grants, host-task-grants: 695 of 695 pass.
4. Live probe: human-verified / developer-run, recorded on the ticket.
5. Bash startup files: `main-git-rule.test.mjs` last describe, one test per entry per role plus absolute home form.
6. npm test, risk-check, gitleaks, security: process, not a test.

## Red check

`node --test` on the three files: 75 tests, 14 pass, 61 fail. Failures are all missing features (mainGit ignored, prepareMainGit and publish not exported, argv still `-b`, 201 instead of 400 for the rc files). No syntax or import errors. The 14 passing are unchanged guards (e.g. a bad ref refused, `~/bash_notes` allowed).

## Failed calls

None.
