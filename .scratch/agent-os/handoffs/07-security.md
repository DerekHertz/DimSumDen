```json
{
  "ticket": "agent-os/07-grant-hardening",
  "cell": "security",
  "current_step": "Full security review of tests/agent-os-07-grant-hardening at 69bdee9: Security pass. No critical or high finding. risk-check hit on governance.json only (expected). gitleaks: no leaks in 2 commits. No dependency, lockfile or CI change.",
  "artifacts": [
    "apps/bridge/cells/grant-policy.mjs (reviewed, probed live with a script)",
    "apps/bridge/cells/host.mjs, claude-adapter.mjs, governance.json (reviewed)"
  ],
  "decisions": [
    "Pass. The governance.json edit adds the bare .git entry only; it tightens the deny list and removes nothing.",
    "grantRefusal is the only route from POST /tasks into parseGrants/compileCeiling; the governed denies in the adapter stay as the second layer. Reasons are constant strings and never echo the grant value.",
    "resolveReal check-time-only symlink resolution: low, accepted. Grants are checked at task creation before the agent exists; the sandbox resolves real paths when it enforces, and a swap needs a second local actor.",
    "Non-GitHub git host stays grantable (gitlab.com, bitbucket.org probed, both null): low. The shell sandbox closes ~/ for reads, so the agent has no credentials to push with, and the ticket scoped the fix to GitHub. Revisit when agent-os/05 adds the Start box grants table."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Medium follow-up, one line in RC_FILES (grant-policy.mjs:22): add .bash_profile, .bash_login, .bash_logout, .bash_aliases (probed: all four accepted today). Not a bounce; fold into agent-os/09 or a small ticket, with a test per entry.",
      "owner": "developer"
    }
  ]
}
```

# security review (full): agent-os/07-grant-hardening

Branch tests/agent-os-07-grant-hardening at 69bdee9, diff against origin/main: claude-adapter.mjs, governance.json, grant-policy.mjs (new), host.mjs, grants-hardening.test.mjs. Verdict: Security pass.

## Checks run

- risk-check: 1 hit, `apps/bridge/cells/governance.json` (guardrail file). Expected.
- gitleaks detect over origin/main..69bdee9: 2 commits, no leaks.
- Dependencies: no package.json, lockfile or `.github/` change.
- Probe: `grantRefusal` run against about 40 sample grants (script in scratchpad). Refused as intended: governed paths in any case (`.GIT`), `.claude`, `.github/workflows`, `~/.ssh`, `~/.SSH`, `/etc`, `/Etc`, `/lib`, the home directory and its parents, the main checkout root (worktree reason), `/proc/self/root/...` forms, and `github.com`, `api.github.com`, `x.github.com`.

## Findings

- medium: `apps/bridge/cells/grant-policy.mjs:22` RC_FILES omits `.bash_profile`, `.bash_login`, `.bash_logout` and `.bash_aliases`. All four probe as accepted. They are shell startup files, the category the user's decision names ("a shell rc file"), and a write allow runs code at the next login shell outside the sandbox. A grant is chosen by the user in the Start box, so this does not block. Fix: add the four names, with a test per entry.
- low: `apps/bridge/cells/grant-policy.mjs:32` `resolveReal` resolves symlinks at check time only. Accepted: grants are checked at task creation before the agent exists, and the sandbox enforces real paths.
- low: non-GitHub git hosts (gitlab.com, bitbucket.org) are grantable and the `Bash(*git *push*)` quoting bypass works against them. Mitigated because the shell sandbox closes `~/` for reads, so no credential is reachable. The ticket scoped the fix to GitHub. Revisit with agent-os/05.
- low: credential directories outside the decided list are grantable: `~/.aws`, `~/.gnupg`, `~/.npmrc`, `~/.netrc`, `~/.kube`, `~/.docker`. A grant reopens read and write there. It is the user's explicit choice and outside the decided list; consider adding them when the list is next touched.
- low: `/var`, `/opt`, `/run` and other users' home directories are grantable. Single-user machine; no action.

## Residual, out of scope

Main checkout `.git/refs` and `HEAD` writable from a worktree: agent-os/09. Sibling-worktree deny: agent-os/10.
