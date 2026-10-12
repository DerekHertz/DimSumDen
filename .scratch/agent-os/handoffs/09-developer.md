```json
{
  "ticket": "agent-os/09-main-git-write-rule",
  "cell": "developer",
  "current_step": "Implemented and committed on tests/agent-os-09-main-git-write-rule (e722a3b, on top of qa's 6bcf5bc). The 75 specify tests are green; the live probe through the real createClaudeRuntime refused every ref/HEAD/packed-refs write. Full suite, risk-check and gitleaks results are in the Verification section.",
  "artifacts": [
    "apps/bridge/cells/claude-adapter.mjs (compileCeiling mainGit option, MAIN_GIT_DENIED)",
    "apps/bridge/cells/claude-runtime.mjs (passes mainGit through)",
    "apps/bridge/cells/workspace.mjs (detached create, publish, prepareMainGit)",
    "apps/bridge/cells/host.mjs (preflight, mainGit arg, publish on agent end)",
    "apps/bridge/cells/grant-policy.mjs (RC_FILES + 4 bash startup files)",
    "apps/bridge/cells/conformance-live.test.mjs and host-task.test.mjs (one-line updates for the new mainGit key; not qa's tests)"
  ],
  "decisions": [
    "mainGit denies are added to compileCeiling's denyAbs, so they reuse the existing sandbox denyWrite and Write/Edit rule plumbing. Keyed on mainGit, not root.",
    "Preflight runs after workspaces.create and before runtime.spawn. A preflight failure removes the worktree and answers 502 'the repository's git directory is not ready for the agent'. (noGit root still answers 500 from create, so the existing test holds.)",
    "A missing index is refused, not recreated: an empty file is an invalid index and read-tree would change main's staged state. packed-refs is made with git pack-refs --all --no-prune; a failed attempt is judged by whether the file exists afterwards.",
    "publish runs in the host's watch() after the process exits, before finalize, for every agent (an agent with no commit gets a branch at the base HEAD). A publish failure is logged and never undoes the end.",
    "publish accepts only a den/<feature>/<NN>-<slug>-<8 hex> name and never moves an existing branch (git branch refuses)."
  ],
  "failures": [],
  "pending": [
    {
      "item": "qa verify (light, qa specified) and then full security review per criterion 6. Points for security: git worktree add by the sandboxed agent fails (Read-only file system under main/.claude/worktrees, expected); git gc --auto printed nothing in the probe repo (too small to trigger).",
      "owner": "qa"
    }
  ]
}
```

# developer: agent-os/09-main-git-write-rule

## Live probe (criterion 4), recorded

Setup: throwaway repo in /tmp, `createWorkspaces.create` (detached), `prepareMainGit`, then a real claude haiku developer child through `createClaudeRuntime().spawn` with `mainGit`, no grants, every permission request denied. Script was in the scratchpad (not committed). First run was spoiled by the model appending `; echo "exit=$?"` to commands, which raises a permission request; rerun with "exactly as written" gave 0 permission requests.

| Step | Result |
| --- | --- |
| `echo sha > main/.git/refs/heads/probe-sh` (Bash) | exit 1, `Read-only file system` |
| `echo "ref: ..." > main/.git/HEAD` (Bash) | exit 1, `Read-only file system` |
| Write tool, `.git/refs/heads/probe-write` | `denied by your permission settings` |
| Write tool, `.git/HEAD` | `denied by your permission settings` |
| `git update-ref refs/heads/probe-upd` | exit 128, `Unable to create ...probe-upd.lock: Read-only file system` |
| `git branch probe-new` | exit 128, `Read-only file system` |
| `git tag probe-tag` | exit 128, `Read-only file system` |
| `echo >> main/.git/packed-refs` (Bash) | exit 1, `Read-only file system` |
| `git commit --allow-empty -m probe-commit` in the worktree | succeeded: `[detached HEAD 9659e38] probe-commit` |
| `git gc --auto` | succeeded, no output |
| `git worktree add main/.claude/worktrees/probe-wt2 HEAD` | exit 128, `Preparing worktree (detached HEAD 9659e38)` then `fatal: could not create leading directories of '.../probe-wt2/.git': Read-only file system` |
| `git log --oneline -3` | `9659e38 probe-commit`, `156c45b base` |

After the run: main `HEAD` unchanged, refs exactly `refs/heads/main`, packed-refs unchanged, none of the probe ref files exist, the worktree HEAD moved to the new commit and stayed detached. 0 permission requests. A sandboxed agent cannot run `git worktree add` into the main checkout (its write allow list is only its own worktree); it is not a ref write.

## Verification

- `npm test`: 4286 of 4286 pass (scout, exit 0).
- `npm run risk-check`: exit 1, 3 hits, all "shelling out to another program" (claude-runtime.mjs, workspace.mjs, main-git-rule.test.mjs). workspace.mjs runs git through execFile with argument lists (the new git calls are pack-refs, rev-parse, branch, worktree add --detach); claude-runtime.mjs hit is the existing spawn. Full security review is needed.
- gitleaks (`--no-git --source apps/bridge`): no leaks found.

## Notes for the orchestrator

- Two existing tests outside qa's files needed a one-line change because spawn args and compiled settings now carry mainGit: `conformance-live.test.mjs` (expected argv) and `host-task.test.mjs` (key list). Neither is an agent-os/02 or 07 test.
- Not specified and chosen here: a preflight refusal answers 502; publish runs for an agent that made no commit.

## Failed calls

- Bash, `node -e "..."` with a multi-line inline edit script: refused by the worktree isolation guard ("git in a form too complex to verify"). Used Write/Edit instead. Genuine guardrail.
- Live probe run 1: the model appended `; echo "exit=$?"` and the 6 git commands became permission requests that the probe denied; reran with a stricter prompt. Probe design friction, not a product bug.
