```json
{
  "ticket": "agent-os/07-grant-hardening",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Full verify of tests/agent-os-07-grant-hardening at 69bdee9: QA pass. Suite 4225 pass, 0 fail, 0 skipped (developer's saved output /tmp/07-tests.txt, not re-run). No test file changed since the specify commit c68ddad. Every criterion maps to a test or is human-verified. Both criterion 6 reasons are recorded on the ticket and hold, with one note.",
  "artifacts": [
    "apps/bridge/cells/grants-hardening.test.mjs (qa tests, unchanged since c68ddad)",
    "apps/bridge/cells/grant-policy.mjs (new, reviewed)"
  ],
  "decisions": [
    "Verdict QA pass, written with board comment --verdict pass.",
    "Criterion 6, ticket-directory read stays: holds. grants-paths.test.mjs:162 asserts additionalDirectories equals the ticket directory, so a fix would change an unchanged-by-contract test; the directory .scratch/den/issues holds only den task tickets. The 'CLI takes directories only' premise I did not re-prove; it is the developer's claim and it matches the adapter, which has no file-level form.",
    "Criterion 6, shell quoting around git push and gh api: holds for what the ticket asked. isWallHost only accepts lowercase dotted names with no trailing dot or wildcard, and grantRefusal refuses github.com and any *.github.com, so github hosts are not grantable (tests cover github.com, api, uploads and gist subdomains; notgithub.example.com stays 201). Note: a non-GitHub git host (for example a self-hosted forge) can still be granted and the quoting bypass of Bash(*git *push*) works against it. The ticket scoped the fix to GitHub, so this is a note for security, not a bounce.",
    "governance.json edit: adds the bare .git entry only (plus whitespace). Inside the criterion 4 scope. risk-check lists apps/bridge/cells/governance.json as a guardrail file, so it will hit and dispatch security regardless.",
    "Scope: the diff since c68ddad touches claude-adapter.mjs, governance.json, grant-policy.mjs (new) and host.mjs only. The extra refused rc files and system directories are the user's kept decision (2026-10-11). Nothing for agent-os/09 was built."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Run npm run risk-check and gitleaks (criterion 7); a hit on governance.json is expected. Full security review, including: the non-GitHub git-host quoting residual, resolveReal following symlinks only through existing ancestors (races between check and spawn), and the lowercase compare in governedUnder.",
      "owner": "security"
    }
  ]
}
```

# qa verify (full): agent-os/07-grant-hardening

Branch tests/agent-os-07-grant-hardening at 69bdee9. Verdict: QA pass.

## Checks

1. Suite: 4225 tests, 4225 pass, 0 fail, 0 skipped (developer's saved output). The developer saw one flaky unrelated failure ('npm run dev listens on 127.0.0.1 only') in an earlier run that passed on rerun.
2. Specify tests: `git diff c68ddad HEAD --name-only -- '*.test.mjs'` is empty, so no assertion was removed or loosened.
3. Criterion to test map:
   - 1 governed and main `.git` paths: grants-hardening.test.mjs, "refuses a path grant on a governed path".
   - 2 home and system list, a test per entry: "refuses a path grant on a home or system path".
   - 3 deny rules unchanged: "deny rules of agent-os/02 stay as the second layer" plus the unchanged grants.test.mjs and grants-paths.test.mjs.
   - 4 bare `.git` entry: "a bare .git entry covers the worktree's .git pointer file" (Write(.git), Edit(.git)); live check recorded on the ticket (developer, real haiku child; the CLI already protects the pointer file, so the entry is belt and braces).
   - 5 live probe: human-verified, recorded on the ticket (main `.git/refs` and `HEAD` writable from a worktree; moved to agent-os/09 by user decision).
   - 6 low findings: `.GIT` casing, symlinks and GitHub hosts have tests; ticket-directory read and shell quoting have recorded reasons (below).
   - 7: suite green; risk-check, gitleaks and security review are the next stages.
4. Scope: diff files are claude-adapter.mjs, governance.json, grant-policy.mjs (new), host.mjs. All in scope.

## Criterion 6 reasons

Both are on the ticket (last orchestrator comment) and in 07-developer-2.md.
- Ticket-directory read stays. Holds: `grants-paths.test.mjs:162` asserts `additionalDirectories` is `["/work/den/.scratch/den/issues"]`, `claude-adapter.mjs:149` builds it from the directory, and that directory holds den task tickets only.
- Shell quoting and `gh api`: holds as the ticket scoped it. The `grant-policy.mjs:63` check refuses `github.com` and `*.github.com`, and host grants cannot carry uppercase, a trailing dot or a wildcard (`WALL_HOST_RE`), so there is no bypass of the check. Residual for security: another git host can still be granted, and the Bash-rule quoting bypass would work against it.

## For security

`resolveReal` resolves symlinks at check time only; a link created after the check is not seen. The grant-policy reasons do not echo the value.
