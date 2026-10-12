# Handoff: agent-os/11 qa specify

```json
{
  "ticket": "agent-os/11-main-git-rule-followups",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Tests written and committed on tests/agent-os-11-main-git-rule-followups (4a8f331, base 8329967). 22 fail for the right reason (spawned with the main .git denies missing); 6 pass as characterization of existing behavior.",
  "artifacts": [
    "apps/bridge/cells/main-git-failclosed.test.mjs"
  ],
  "decisions": [
    "Criterion 1 is outcome-based: a spawn is either refused (runtime throws, or host answers non-201 with the stub never started, no worktree left, reservation released) or it spawns with all four denies in sandbox.filesystem.denyWrite. Both pass, so the developer may pick runtime throw or host 502. Silence (spawned, denies absent) fails.",
    "Odd paths: space, quote, non-ASCII letter, glob star at the runtime seam; space, quote, non-ASCII at the host seam (fixture repo renamed before bridge start). Roles: developer, qa, security, scout.",
    "Criterion 3 pins publish's CURRENT behavior for a no-commit agent: the den/ branch is created at the base HEAD, main HEAD unmoved, a second publish rejects. If the developer or user prefers 'no branch for an empty run', that is a scope change: ask before changing the test."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Make the 22 red tests pass without editing main-git-failclosed.test.mjs or the agent-os/02, 07, 09 tests. Likely change: claude-runtime.mjs line 59, throw when mainGit is given but not a plain path (isWorktreePath false), instead of dropping it; the host's existing 502 spawn-failure branch then refuses and cleans up.",
      "owner": "developer"
    }
  ]
}
```

## Criterion map

1. Fail closed on an unusual main .git path:
   - describe "the runtime never spawns a walled role without the main .git denies" (16 red: 4 roles x 4 paths; 1 green guard that a plain mainGit still gets denies)
   - describe "a repository whose path is not plain starts no walled agent ..." (6 red, real runtime + stub, /tasks)
2. Host preflight refusal (index removed from the fixture repo): describe "the host's preflight refusal" (3 green): 502, fake runtime never asked to spawn, no worktree directory, no git worktree entry, no den branch, no agents, no spawn line in sessions.jsonl, second dispatch also 502 not 409, then a dispatch succeeds after the index is restored; same for POST /tasks.
3. publish with no commit: describe "publish for an agent that made no commit" (2 green): workspace seam and host seam.
4. agent-os/02, 07, 09 tests unchanged: this branch touches only the new test file.
5. `npm test`, risk-check, gitleaks, security review: not tested here; the orchestrator and security run them (human-verified or process-only).

## Run

`node --test apps/bridge/cells/main-git-failclosed.test.mjs`: 28 tests, 6 pass, 22 fail. Not run: the full `npm test` (only the new file was added).
