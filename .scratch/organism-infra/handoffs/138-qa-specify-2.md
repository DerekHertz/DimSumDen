# 138 qa specify fix round: S6b impossible assertion

```json
{
  "ticket": "organism-infra/138-steering-spike-tooling",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Fixed the one S6b test no correct implementation could pass. Committed on tests/138-steering-spike-tooling as 4a1bf82. Against the developer's conformance.mjs (feat/138-steering-spike-tooling), the whole conformance.test.mjs file passes: 82 pass, 0 fail, 0 skipped.",
  "artifacts": [
    "apps/bridge/cells/conformance.test.mjs (branch tests/138-steering-spike-tooling, commit 4a1bf82)"
  ],
  "decisions": [
    "The test called realpathSync(seen.cwd) after runSpikes returned, but asserts the worktree was removed, so it always threw ENOENT. Now it asserts realpathSync(path.dirname(seen.cwd)) equals the realpath of <repo>/.claude/worktrees (the parent survives removal) and path.basename(seen.cwd) matches /^s6b-/. Intent kept: the child ran in a detached worktree directly under <repo>/.claude/worktrees with an s6b- name.",
    "Removal asserts (worktreeCount equals 1, leftoverWorktrees empty) are unchanged. No other test touched."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Rebase or merge tests/138-steering-spike-tooling into the developer's branch, then run S6b tests and full npm test, /code-review on the diff since 7c2eee1, release at in-review (per 138-developer-3.md)",
      "owner": "developer"
    }
  ]
}
```
