```json
{
  "ticket": "agent-os/02-grants",
  "cell": "developer",
  "current_step": "qa verify bounce 1 fixed on tests/agent-os-02-grants at 6ca76af: .git governed, .git probe run and recorded, bare-ceiling allowWrite test added; npm test 4014/4014",
  "artifacts": [
    "apps/bridge/cells/governance.json",
    "apps/bridge/cells/grants-paths.test.mjs",
    "apps/bridge/cells/grants.test.mjs"
  ],
  "decisions": [
    "User decision 1: '.git/**' added to governance.json guardrailPaths. Effect: in the agent's own worktree, Write/Edit(.git/**) and sandbox denyWrite <worktree>/.git; for a path grant in the main checkout, any grant on <root>/.git or under it (config, hooks, worktrees/...) gets Write/Edit(//<root>/.git/...) deny rules and sandbox denyWrite. A grant above .git is the main checkout itself, already a 400 (contains the worktree). No adapter code change: governedUnder reads the list.",
    "Tests: 14 new in grants-paths.test.mjs (grant on .git, .git/config, .git/hooks, a worktree admin dir, x developer/qa/security; .gitignore not caught; relative .git/** deny with no grant; grant on root is TypeError). One new test in grants.test.mjs after 'no grant is the same as today's ceiling': no sandbox.filesystem.allowWrite for scout/developer/qa/security with no grant or only a host grant. I added tests only; no existing qa assertion was edited or removed.",
    "Red first: the .git tests and the 'no grants' case failed before governance.json changed (the allowWrite test failed on my own test error, scout takes no host grant, fixed in the test; it passes on the unchanged code, since the gap was coverage, not a defect)."
  ],
  "failures": [],
  "pending": [
    {
      "item": "qa light verify of the three items; then security review for the risk-check hits (claude-runtime.mjs shell-out, governance.json guardrail, risk-check.governance.test.mjs shell-out). governance.json is a guardrail file, so risk-check hits again.",
      "owner": "qa"
    }
  ]
}
```

# developer: agent-os/02 (round 3, after qa verify bounce 1)

Branch `tests/agent-os-02-grants`, commit 6ca76af on 7be73f3. `npm test` 4014 pass, 0 fail, 0 skipped (output in the scratchpad, 02-tests-3.txt).

## The .git/config probe (live, real claude haiku, production runtime path, 0 unexpected permission requests)

Setup: a throwaway main repo (in /tmp), a real `git worktree add` under `<main>/.claude/worktrees/`, a developer child with cwd the worktree. Steps: shell append to `<main>/.git/config`, shell write to `<main>/.git/hooks/probe-hook`, Write tool to `<main>/.git/probe-write.txt`, `git config --local`, and a write inside the worktree. Script: scratchpad live-git.mjs, MODE=bare|grant.

- Bare (no grant, as a normal task): shell writes to `.git/config` and `.git/hooks` both failed with `Read-only file system`. `git config --local probe.key v` failed (could not lock config file). The Write tool to `<main>/.git/...` raised a permission request (it asks, as the spike said for file tools outside the worktree; the probe denied it). `.git/config` unchanged; worktree write succeeded.
- With a path grant on `<main>/.git` (after the fix): shell writes `Read-only file system`, `git config --local` `Read-only file system`, the Write tool refused outright ("directory denied by your permission settings", no request). `.git/config` unchanged; worktree write succeeded.

Answer for the spike: the sandboxed shell cannot write the main checkout's `.git` from a worktree in this run, so the spike's "writable" observation does not reproduce for shell writes here (it may have come from git itself writing its own admin files, or an older setting). The Write tool outside the worktree asks. With the grant, `.git` is refused for every route. No path grant can make `.git` writable now.

## Notes

- Probe temp dirs removed; no background processes left.
- Gitleaks and risk-check results are unchanged from round 2 (2 old findings not from this branch; risk-check hits expected, security dispatched).
