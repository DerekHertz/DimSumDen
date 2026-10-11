```json
{
  "ticket": "agent-os/02-grants",
  "cell": "developer",
  "current_step": "implemented on tests/agent-os-02-grants (51bf867); qa's tests green, npm test 3974/3974; one live gap open: the ticket Read is blocked when a host grant brings the read limit",
  "artifacts": [
    "apps/bridge/cells/claude-adapter.mjs",
    "apps/bridge/cells/governance.json",
    "apps/bridge/cells/claude-runtime.mjs",
    "apps/bridge/cells/host.mjs",
    "apps/bridge/server.mjs",
    "scripts/risk-check.mjs",
    "scripts/risk-check.governance.test.mjs"
  ],
  "decisions": [
    "Governance list lives in apps/bridge/cells/governance.json (ceilings.json is pinned to four keys); added to risk-check GUARDRAIL_PATHS with a test.",
    "compileCeiling(role, { worktree, grants }) returns wall, worktree, forbid, writePaths, readLimit; buildClaudeArgs validates all of them and needs the wall for the last three.",
    "Deny commands compile to infix rules Bash(*git *push*) so wrapped forms are caught. Security's CI-path exception is data: governance.json ciGrantRoles.",
    "A path grant that contains the worktree is a TypeError (it would open the main checkout and sibling worktrees). A grant inside the main checkout is NOT covered by the governance denies (the adapter does not know the repo root).",
    "Host names: last label must be letters or xn--, private labels (local, internal, lan, home, arpa, localdomain, localhost...) refused, sparse arrays refused."
  ],
  "failures": [
    "Read limit with a host: permissions.blockReadsOutsideWorkingDirectories blocks the FILE tools but not a sandboxed shell read (head ~/.gitconfig worked), and it also blocks the allowed Read of the agent's ticket file in the main checkout. sandbox.filesystem.denyRead [\"~/\"] with allowRead [worktree, ticket, granted paths] does close the shell read (live: No such file). So both are now emitted."
  ],
  "pending": [
    {
      "item": "With a host grant the agent cannot Read its ticket file (file tool says blocked by blockReadsOutsideWorkingDirectories, the Read allow rule does not override). Try permissions.additionalDirectories for the ticket's directory, or drop blockReads and use Read deny rules for home. Re-run MODE=host of the live script. Until this holds, do not ship host grants as usable.",
      "owner": "developer (fresh cell, same branch)"
    },
    {
      "item": "Not done: .git/config probe of the main checkout; hardware limits decision (systemd-run argv, values per role, memory-kill policy); a live test of a path grant (allowWrite) and the security CI exception. Hardware limits and .git probes may be split to their own ticket.",
      "owner": "orchestrator to decide"
    },
    {
      "item": "risk-check and gitleaks not run by me. risk-check will hit ceilings-adjacent guardrail (governance.json) and claude-adapter, so security is dispatched.",
      "owner": "orchestrator"
    }
  ]
}
```

# developer: agent-os/02

Branch `tests/agent-os-02-grants`, commit 51bf867 on qa's 28a0244. qa's five test files pass (595), `npm test` 3974 pass, 0 fail. I did not edit qa's tests.

## Live check (real claude 2.1.293, haiku, production runtime path; script: scratchpad live02.mjs)

Base (developer, no grants): Write and Edit in the worktree done, `node --test` ran, 0 permission requests. Refused: `echo > /tmp/outside` (Read-only file system), `git push` (denied), Write `.github/workflows/ci.yml` ("denied by your permission settings"), shell write of `.github/workflows/ci2.yml` (Read-only file system), `echo x > Jenkinsfile` (Permission denied), `git -c core.hooksPath=/dev/null commit` (denied), `echo ok` newline `gh pr merge 1` (the merge denied, the echo ran).

Host grant (registry.npmjs.org): see Failures above. Shell read of home closed by denyRead; file tools blocked by blockReads; the ticket Read is wrongly blocked (open).

## Notes

- The strict whole-string matcher plus infix rules: ordinary commands like `git commit -m 'fix git push docs'` would be refused. Accepted per the user's decision.
- Per-role hardware limits, `.git/config`, and the path-grant live check are untouched.
