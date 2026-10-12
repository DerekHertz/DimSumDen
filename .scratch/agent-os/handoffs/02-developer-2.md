```json
{
  "ticket": "agent-os/02-grants",
  "cell": "developer",
  "current_step": "all three open items done on tests/agent-os-02-grants (7be73f3); npm test 3998/3998; ready for qa verify then security",
  "artifacts": [
    "apps/bridge/cells/claude-adapter.mjs",
    "apps/bridge/cells/claude-runtime.mjs",
    "apps/bridge/cells/host.mjs",
    "apps/bridge/cells/grants-paths.test.mjs"
  ],
  "decisions": [
    "Ticket Read under the read limit: permissions.additionalDirectories = the ticket file's directory, emitted with blockReadsOutsideWorkingDirectories. Live: ticket Read ok, Write in worktree ok, node --test ok, shell read of ~/.gitconfig no such file, Read of ~/.gitconfig blocked.",
    "Path grant containing the worktree: exported grantContainsWorktrees(grant, { root, home, worktree }) (grant is the worktree, or an ancestor-or-equal of <root>/.claude/worktrees). host.directOne returns 400 before a ticket is written (error text does not echo the path); compileCeiling still throws TypeError. A ~/ grant is checked when home is known (host uses os.homedir(), runtime uses env.HOME).",
    "Path grant inside the main checkout: compileCeiling takes root and home and returns denyAbs (absolute governed paths the grant reaches: the grant itself under a governed dir, the governed path when the grant is above it). buildClaudeArgs accepts denyAbs (validated, needs the wall) and settingsFor emits Write/Edit deny rules and sandbox.filesystem.denyWrite. A grant inside the agent's own worktree adds none (the relative denies cover it). Security's CI exception applies to its worktree only, not the main checkout.",
    "host passes root (realpath of the main checkout) in spawn args only when there are grants; the runtime forwards it to compileCeiling.",
    "Sibling-worktree grants are denied at the grant, never as the whole <root>/.claude/** (that would deny the agent's own worktree)."
  ],
  "failures": [
    "risk-check: 3 hits (claude-runtime.mjs shell-out, governance.json guardrail, risk-check.governance.test.mjs shell-out). Security is dispatched.",
    "gitleaks: 2 findings, both in old commits and not from this branch: curl-auth-header in host-approvals.test.mjs (18c30d45) and aws-access-token in .scratch/organism-infra/handoffs/38-security.md (0c918a1e)."
  ],
  "pending": [
    {
      "item": "qa verify (light, qa specified): check grants-paths.test.mjs (mine, not qa's) against the new criteria; security review for the risk-check hits. Not done: .git/config probe of the main checkout (a grant on the main checkout's .git is not in the governed list); hardware limits are agent-os/06.",
      "owner": "qa"
    }
  ]
}
```

# developer: agent-os/02 (round 2)

Branch `tests/agent-os-02-grants`, commit 7be73f3 on 51bf867. I did not edit qa's tests; the new tests are in `grants-paths.test.mjs` (24). `npm test` 3998 pass, 0 fail (full run sent to a file).

## Live checks (real claude, haiku, production runtime path; 0 permission requests each)

- Host grant (registry.npmjs.org): ticket Read succeeded, hello.txt written, `node --test` passed, `head ~/.gitconfig` failed (No such file), Read of `~/.gitconfig` blocked.
- Path grant `<main>/.github` with root passed: Write and shell write of `.github/notes.txt` and `.github/shell.txt` succeeded; Write of `.github/workflows/x.yml` denied ("directory denied by your permission settings"); shell write of `.github/workflows/y.yml` Read-only file system; write outside refused.
- security with a grant `<worktree>/.github`: Write and shell write of `.github/workflows/ci.yml` and `ci2.yml` succeeded; Write of `Jenkinsfile` (not granted) denied.

## Notes

- Host grants are now usable. Scripts are in the earlier cell's scratchpad (live02.mjs, MODE=host|path|ci, ROLE).
- The main checkout's `.git` is not in the governed list, so a path grant on it is not denied (unchanged; probe left for a later ticket).
