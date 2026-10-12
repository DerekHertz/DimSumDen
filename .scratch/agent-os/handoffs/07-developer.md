```json
{
  "ticket": "agent-os/07-grant-hardening",
  "cell": "developer",
  "current_step": "STOPPED at the live probe, as the ticket requires: writes to the main checkout's .git/refs and .git/HEAD SUCCEEDED from a sandboxed developer child in a worktree. No code written; branch tests/agent-os-07-grant-hardening is unchanged at c68ddad.",
  "artifacts": [
    "probe script (scratchpad, not committed): live-refs.mjs, adapted from agent-os/02's live-git.mjs"
  ],
  "decisions": [
    "Stopped before building anything else, per the ticket ('If a write succeeds, stop and report before building anything else').",
    "Released at blocked (not in-review): the orchestrator and user must decide the response to the open write before the grant-hardening build continues."
  ],
  "failures": [],
  "pending": [
    {
      "item": "User/orchestrator decision: how to close the open .git/refs, HEAD and update-ref writes (see Result). Then re-dispatch a developer to build the agent-os/07 tests-to-green work plus that fix.",
      "owner": "orchestrator"
    },
    {
      "item": "Make grants-hardening.test.mjs green (180 failing), the bare .git entry, low findings, and the live Write-tool check of <worktree>/.git (this probe already shows the Write and Edit tools to <wt>/.git are denied today, see Result).",
      "owner": "developer"
    }
  ]
}
```

# developer: agent-os/07-grant-hardening, stopped at the refs probe

## Probe setup (live, real claude haiku, production runtime path)

Same shape as agent-os/02's `.git/config` probe (`02-developer-3.md`): a throwaway main repo in /tmp, a real `git worktree add` under `<main>/.claude/worktrees/`, and a developer child spawned through `createClaudeRuntime().spawn` with cwd the worktree, no grants (a normal task), a ticket file, model haiku. Code under test: this branch at c68ddad, which is the agent-os/02 code (grants merged, `.git/**` governed). Script: scratchpad `live-refs.mjs`, run once, `MODE=bare`. The temp repo and board dirs are removed.

## Result: writes SUCCEEDED

| Step | Tool | Result |
|---|---|---|
| `echo <sha> > <main>/.git/refs/heads/probe-sh` | Bash | **succeeded**; the file exists, `git for-each-ref` lists `refs/heads/probe-sh` |
| `echo "ref: refs/heads/probe-sh" > <main>/.git/HEAD` | Bash | **succeeded**; `.git/HEAD` changed (main checkout now on a different branch) |
| `git update-ref refs/heads/probe-upd <sha>` | Bash (git, run from the worktree) | **succeeded**; ref exists in the main repo |
| `git branch probe-new` | Bash | **succeeded**; ref exists in the main repo |
| Write `<main>/.git/refs/heads/probe-write` | Write tool | raised a permission request (it asks; the probe denied it). Nothing written |
| Write `<main>/.git/HEAD` | Write tool | failed on "File has not been read yet" (a Write precondition, not a permission denial); not retried after a Read, so the Write-tool route to HEAD is unproven either way |
| Write `<wt>/.git` (the worktree pointer file) | Write tool | **denied outright**: "directory denied by your permission settings" |
| Edit `<wt>/.git` | Edit tool | **denied outright**, same message |
| `echo ok > <wt>/ok.txt` | Bash | succeeded (control) |

0 unexpected permission requests apart from the one Write above. Final refs in the repo: `main`, `probe-branch`, `probe-new`, `probe-sh`, `probe-upd`. `<wt>/.git` was unchanged.

## What this means

- The sandboxed shell can create and move refs, repoint HEAD, and run `git update-ref` / `git branch` against the main checkout from a worktree. The agent-os/02 probe saw `Read-only file system` only for `.git/config` and `.git/hooks`. The likely reason is that Claude Code's sandbox protects exactly those two by default and nothing else under `.git`; `governance.json`'s `.git/**` is a Write/Edit permission rule for the worktree-relative `.git`, and the sandbox `denyWrite` for the main checkout's `.git` is added only when a path grant carries `root` (`denyAbs`). A bare task has no `root`, so nothing denies `<main>/.git/refs` or `<main>/.git/HEAD`.
- Impact: an agent can create, delete or move branches (including `main`) and repoint HEAD in the main checkout. It cannot push (`git push` is denied and the wall blocks hosts), but it can corrupt the checkout the orchestrator and user use, or stage a ref for a later `git push` by another cell.
- Good news for the ticket's third item: the Write and Edit tools to `<worktree>/.git` (the pointer file) are already denied live, without a bare `.git` entry. Adding the bare `.git` entry as qa's tests require is still right (the tests check the compiled rule).

## Suggested fix to decide on (not built)

Pass `root` to `compileCeiling` for every task that spawns in a worktree (not only when grants exist), so `denyAbs` / sandbox `denyWrite` always covers `<main>/.git` (at least `refs`, `HEAD`, `packed-refs`, `objects`, `worktrees`), then re-run this same probe and confirm `Read-only file system`. A caveat to check in that probe: `git commit` in the worktree writes `<main>/.git/worktrees/<name>/` (its own HEAD, index) and `<main>/.git/objects` and `refs/heads/<branch>`, so a blanket deny of the whole `.git` would break the developer's own commits. The deny likely needs to allow `objects`, `worktrees/<own>` and the agent's own branch ref, and deny the rest. That is a design question for the orchestrator and architect.

## Environment issues

None. The probe ran with no classifier denial.

## Failed calls

- Bash, a `node -e` one-liner that wrote a script and used `git` text in its argument: rejected by the worktree isolation guard ("names git in a form too complex to verify"). Wrote the script with the Write tool instead. Genuine guardrail.
