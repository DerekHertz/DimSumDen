# Handoff: agent-os/09 security (full review)

```json
{
  "ticket": "agent-os/09-main-git-write-rule",
  "cell": "security",
  "current_step": "Full security review of e722a3b vs origin/main done. Verdict: Security pass, with two medium and two low findings that do not block.",
  "artifacts": [
    "apps/bridge/cells/claude-adapter.mjs",
    "apps/bridge/cells/claude-runtime.mjs",
    "apps/bridge/cells/host.mjs",
    "apps/bridge/cells/workspace.mjs",
    "apps/bridge/cells/grant-policy.mjs"
  ],
  "decisions": [
    "Pass: no critical or high finding. gitleaks over origin/main..e722a3b found no leaks. No dependency, lockfile or .github change, so no audit or CI review was needed.",
    "The four denies are fixed names under a bridge-computed path, with no client string; objects and worktrees stay writable, as designed. The CLI itself already denies hooks, config, commondir and alternates, so the main .git is not otherwise writable for escape."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Follow-ups for the user or a later ticket: findings 1 and 2 below (medium).",
      "owner": "developer"
    }
  ]
}
```

## Findings

1. **medium** apps/bridge/cells/claude-runtime.mjs:59 (spawn): the deny fails open. `isWorktreePath(mainGit) ? { mainGit } : {}` silently drops the main .git denies when the repo path has a character outside `[A-Za-z0-9._@+-]` (a space, say). The spawn goes ahead with the refs, HEAD, packed-refs and index writable. The preflight in host.mjs does not catch it. Safe at the current path (`/home/dhertzell/dimsumden`). The same pattern was already there for `cwd` write rules, but here it drops a hole-closing rule. Suggest the host refuses with 502 when `mainGit` is not a plain path, or the runtime throws.
2. **medium** apps/bridge/cells/host.mjs (preflight 502 branch): no committed test for the refusal path (qa noted this too). It is the guard that stops a bad deny target from breaking git, so it should be pinned.
3. **low** apps/bridge/cells/workspace.mjs publish(): `git -C <worktree> rev-parse HEAD` runs outside the sandbox in a directory the agent controls. The agent can rewrite the worktree's `.git` file to point at another gitdir. Impact is small: `rev-parse HEAD` runs no hooks, and `git branch` then fails unless the object exists in the main repo. Could read the sha with `git -C <root> rev-parse` on the worktree's HEAD file instead. Not blocking.
4. **low** apps/bridge/cells/workspace.mjs prepareMainGit(): `git pack-refs --all --no-prune` rewrites the main checkout's ref storage on first run, racing a human's concurrent git command. It is idempotent, it loses no refs, and a failed attempt is judged by whether the file exists. Informational.

## Checked and fine

- Branch name for publish is pinned to `PUBLISH_BRANCH_RE`; `git branch` never moves an existing branch; execFile argument lists, no shell.
- `agent.workspace` (holds the absolute dir) is not in the `view` the API returns.
- grant-policy RC_FILES now has the four bash startup files; the tests cover each one plus the absolute home form.
- Key tests rerun here: main-git-rule, workspace and host-workspace, 75/75 pass.

Not run here: the live probe (criterion 4, human-verified by qa) and the full suite (qa ran 4286/4286).
