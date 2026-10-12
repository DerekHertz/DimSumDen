```json
{
  "ticket": "agent-os/07-grant-hardening",
  "cell": "architect",
  "current_step": "Design done: cause verified, rule chosen and proved by a live prototype, recorded as ADR 0021 Amendment 2 (proposed). Waiting on the user's accept/decline of the detached-worktree choice.",
  "artifacts": [
    "branch architect/agent-os-07-git-rule at e368a13 (not pushed): docs/adr/0021-...md Amendment 2 (decision 17)",
    "throwaway prototype (scratchpad, not committed): live-rule.mjs and a patched copy of claude-runtime.mjs that merges PROBE_EXTRA into the ceiling"
  ],
  "decisions": [
    "Cause: the adapter adds no deny on the main .git for a task without grants; the CLI itself adds the main .git to allowWrite (worktree common dir) and denies only hooks, config, config.worktree, commondir, objects/info/alternates. Passing root for every task would not be enough: denyAbs is built only from the governed paths a path grant reaches.",
    "Rule: worktree agents commit on a DETACHED HEAD (git worktree add --detach). Sandbox + Write/Edit deny in the main .git: refs, HEAD, packed-refs, index. Kept: objects, worktrees/<own>. The bridge creates the branch at the agent's final sha and pushes (ADR 0021 decision 7).",
    "The sandbox cannot say 'deny other refs, keep my own branch': a deny beats a narrower allow (live: own git commit failed with refs denied and refs/heads/den/feat allowed).",
    "A denyWrite target that does not exist is masked unreadable and breaks every git command (live: packed-refs absent gave 'couldn't read packed-refs: Permission denied'). Every target must exist at spawn: make it exist (git pack-refs --all --no-prune) or refuse the spawn.",
    "The always-on denies key on a NEW compileCeiling option for the main .git path (name it mainGit), not on root. Existing agent-os/02 tests pass root and assert no main-checkout deny for grants that reach nothing (grants-paths.test.mjs lines 173-190, 221-224); keying on root would break them."
  ],
  "failures": [],
  "pending": [
    {
      "item": "User decision (open question 1): accept Amendment 2 (detached worktrees), or choose a fallback. Until then no developer dispatch for the refs fix.",
      "owner": "user"
    },
    {
      "item": "Orchestrator: after acceptance, re-dispatch qa specify to add failing tests for Amendment 2 (list below), then the developer on tests/agent-os-07-grant-hardening. Merge the ADR branch via a PR (docs/ only).",
      "owner": "orchestrator"
    },
    {
      "item": "Developer: build the rule and repeat the live check (below), recorded on the ticket. Make grants-hardening.test.mjs green as before.",
      "owner": "developer"
    }
  ]
}
```

# architect: agent-os/07, the main `.git` write rule

## 1. The cause (confirmed in part, corrected in part)

Verified from `claude-adapter.mjs`, `host.mjs` and the CLI 2.1.293 binary strings.

- The CLI detects a linked worktree (`detectWorktreeGitCommonDir`) and adds the main `.git` to the sandbox write allowances so `git commit` works. It then denies only `hooks`, `config`, `config.worktree`, `commondir`, `objects/info/alternates`, plus `config.worktree` and `commondir` of each `worktrees/<name>`. That is why the agent-os/02 probe saw `Read-only file system` for `config` and `hooks` and the refs probe did not.
- The adapter: `sandboxFor` denies the governed list under `<worktree>/` plus `denyAbs`. `denyAbs` comes only from `governedUnder(path grants)`. `host.mjs:311` passes `root` only when the task has grants.
- The developer's guess ("denyWrite is added only when a grant carries root") is half right. A task with no grants gets nothing. But passing `root` always would still not deny `<root>/.git/refs`: even with a grant elsewhere, `denyAbs` is empty. New code is needed either way.

## 2. The rule

Agents commit detached; the sandbox denies `refs`, `HEAD`, `packed-refs`, `index` in the main `.git` (Write/Edit too, via `denyAbs`). Kept: `objects`, `worktrees/<own>`, and whatever the CLI already leaves open (`logs`, `info`, `worktrees/<other>`; residual, see ADR).

Why not "keep own branch ref, deny the rest": the sandbox cannot express it. Live result (real child, production runtime path, bridge flags; probe on a named branch `den/feat/01-x-abcd1234`, `refs`, `HEAD`, `packed-refs` denied, `refs/heads/den/feat` allowed): own `git commit` failed, `Unable to create '.git/refs/heads/<branch>.lock': Read-only file system`. Deny beats the narrower allow. Git's lock-and-rename needs the directory writable, so an allow on the ref file would not help either.

Live result for the chosen rule (detached worktree, same denies): `git commit` succeeded (`[detached HEAD 27aaa4d]`, `git log` shows it in the worktree); `echo > .git/refs/heads/x`, `echo > .git/HEAD`, `echo > .git/packed-refs`, `git update-ref` (new ref and `refs/heads/main`), `git branch`, `git tag` all refused (`Read-only file system`). Main `HEAD` unchanged, refs unchanged, 0 permission requests.

Sandbox can express it: yes, with detached worktrees. Two limits found: a deny target must exist (else git reads fail), and no narrower re-allow.

Fallbacks if the user declines detach (Amendment 2, "If the user will not detach"): (a) keep the named branch; deny `HEAD`, `packed-refs`, `index`, `refs/tags`, `refs/remotes`, `refs/stash`; `refs/heads` stays writable so `main` can be moved, and the bridge takes the sha from the worktree `HEAD`, not a ref; (b) the container per agent from ADR 0021 decision 2.

## 3. The test seam and the live check

Seam: the pure compile at the top (`compileCeiling` -> `buildClaudeArgs` -> settings JSON), plus one small preflight, so no test needs a live child.

Build shape (for the developer; deep module, small interface):
- `compileCeiling(role, { ..., mainGit })`: when `mainGit` (absolute plain path of `<root>/.git`) is given and the role writes, add `denyAbs` for `<mainGit>/refs`, `HEAD`, `packed-refs`, `index`. Fixed names, no client string. No `mainGit` -> as today.
- `host.mjs` passes `mainGit` for every spawn (grants or not). A runtime preflight (`prepareMainGit(root)`, in `workspace.mjs`, takes `exec`/fs as arguments) checks each target exists, creates `packed-refs` with `git pack-refs --all --no-prune` if absent, and refuses the spawn (502 path already exists) if `.git` is not a directory or a target is still missing.
- `workspace.create` uses `git worktree add --detach <dir> HEAD`; `branch` stays the name the bridge will publish to. `remove` still deletes the branch if one exists. The bridge creating the branch at the final sha belongs with agent-os step 4; for now only record the name.

Tests to add (qa specify, new file, no edits to existing tests): (1) compile with `mainGit`: denyWrite and Write/Edit deny rules contain the four paths, for every role that writes, with and without grants; (2) without `mainGit`: unchanged; (3) host: `spawn.args.mainGit` set on a task with no grants (fake runtime); (4) `prepareMainGit` on a temp repo: creates `packed-refs`, refuses when `.git` is a file or missing; (5) workspace: a created worktree is detached (`git branch --show-current` empty) and its HEAD is the root's HEAD.

Existing tests that WILL change with this design (qa/developer own the edit, I did not touch them): `workspace.test.mjs` lines 77-91 (`create` adds a worktree on a new branch; `branch --show-current` equals the branch; `branch --list den/*` empty after remove) and `host-workspace.test.mjs` lines 57-83, 151-156 (`worktree list` shows `branch refs/heads/<branch>`; failed spawn removes the branch). These assert ADR 0016 amendment 7 (one branch per agent) and must be rewritten to detached. `grants-hardening.test.mjs` (c68ddad): no change needed; none of its 180 tests cover refs. `grants-paths.test.mjs` 173-190: unchanged because the new denies key on `mainGit`, not `root`.

Live check to repeat once the code exists (same shape as the developer's `live-refs.mjs` and my `live-rule.mjs`): through the real `createClaudeRuntime().spawn` with no grants and a detached worktree, haiku, steps: shell write to `.git/refs/heads/x`, `.git/HEAD`, `.git/packed-refs`, `.git/index`; `git update-ref`, `git branch`, `git tag`; Write tool to `.git/refs/heads/y` and `.git/HEAD`; and a positive control `git add && git commit` in the worktree plus `git log`. Expect every write refused, the commit to succeed, main `HEAD` and refs unchanged, 0 permission requests. Also run `git gc --auto` and `git worktree add` once to note their noise (denied writes, should be non-fatal).

## guardrail path

No edit to `apps/bridge/cells/governance.json` is needed. The bare `.git` entry (criterion 4) is already a separate item; it is the only governance.json edit and goes through a gated patch as the ticket says. The new denies are code in `claude-adapter.mjs` / `workspace.mjs`; both are under `apps/bridge/cells/`, which the full `security` review covers (the adapter is a guardrail-class file per ADR 0021 decision 10, so the merge is a user gate).

## Open questions for the user

1. **Accept detached worktrees for den agents? Recommend yes.** It changes ADR 0016 amendment 7 (one branch per agent): the agent has no branch, the bridge makes it at the end. It is the only rule the sandbox can enforce; the fallback leaves `main` movable by an agent. Relay cells are not affected (cell-start already uses `--detach`).
2. **Deny sibling worktrees' admin dirs (`worktrees/<other>`) at spawn, best effort?** Recommend defer: it only affects a sibling agent's `HEAD` and index, not refs the bridge trusts.

## ADR conflicts

Amendment 2 amends ADR 0021 Amendment 1's last-but-two bullet (agent can write `.git`). It conflicts with ADR 0016 amendment 7 (a new branch per agent); the user's acceptance should name that.

## Environment issues

None.

## Failed calls

- Bash, a `node -e` one-liner containing `git` text to edit the probe script: rejected by the worktree isolation guard ("names git in a form too complex to verify"). Used the Edit tool instead. Genuine guardrail.
- First live run (denyWrite on a nonexistent `packed-refs`) broke all git commands in the child; this was a finding, not a tool failure.
