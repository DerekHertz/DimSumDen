```json
{
  "ticket": "agent-os/07-grant-hardening",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests written and committed at c68ddad on tests/agent-os-07-grant-hardening: apps/bridge/cells/grants-hardening.test.mjs, 191 tests, 11 pass (negative controls and unchanged behavior), 180 fail, all because the feature is missing (POST /tasks returns 201 where 400 is expected, or a compiled deny is absent). No import or setup errors.",
  "artifacts": [
    "apps/bridge/cells/grants-hardening.test.mjs (branch tests/agent-os-07-grant-hardening, commit c68ddad)"
  ],
  "decisions": [
    "Seams: POST /tasks (via makeBridge) for every 400; compileCeiling + buildClaudeArgs for the compiled deny rules. No implementation internals are asserted.",
    "Governed-path refusal covers a grant ON a governed path or UNDER one, for developer, qa and security. A grant ABOVE a governed file but not containing the worktree (for example <root>/apps/bridge) is left allowed: the ticket says 'on a governed path', and the agent-os/02 denyAbs tests cover that case. Developer: do not refuse it unless the ticket is clarified.",
    "compileCeiling must keep compiling governed-path grants to denyAbs and not throw (criterion 3); the 400 belongs in the POST /tasks path. grants.test.mjs and grants-paths.test.mjs are unchanged and must stay green.",
    "Refused list is security's list from the ticket comment: ~/.ssh, ~/.claude, ~/.config, ~/.local, ~/.git*, shell rc files (tested: .bashrc, .profile, .zshrc, .zshenv, .zprofile, .zlogin), /etc, /usr, each with paths under it, in ~/ form and in the absolute home form. Refusal is by path segment: /etcetera/x, /usrlocal/x, ~/notes stay 201. Entries with underscores (.bash_profile, id_ed25519) are not in the test list because GRANT_PATH_RE already rejects underscores, so they would pass for the wrong reason.",
    "Case: .GIT, .Git/config, .Claude/agents, .GitHub/Workflows and JENKINSFILE under the main checkout are 400 at POST; compileCeiling for a .GIT grant must either throw TypeError or emit a denyAbs entry starting with <root>/.git (lower-cased compare).",
    "Symlink: a symlink to the main checkout, to its .git, to a governed directory, to the home directory, and a path under a symlink to the root whose target does not exist yet, are 400. A symlink to an ordinary directory stays 201. This needs realpath of the nearest existing ancestor.",
    "GitHub hosts: github.com, api.github.com, uploads.github.com and gist.github.com are 400 as host grants; notgithub.example.com stays 201.",
    "Bare .git entry: compiled developer, qa and security settings deny Write(.git) and Edit(.git) alongside the existing .git/** rules and the denyWrite on <wt>/.git."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Make the tests pass: refuse governed, home and system path grants, and GitHub host grants, with a reason that does not echo the value, in POST /tasks (host.mjs directOne / parseGrants); add the bare .git entry to apps/bridge/cells/governance.json; lower-case and realpath-resolve the grant before matching. Governance.json is a guardrail path, so check whether the developer cell may edit it or needs a gated patch.",
      "owner": "developer"
    },
    {
      "item": "Run and record on the ticket the live probe of writes to the main checkout's .git/refs, HEAD and git update-ref from a worktree, and the live Write-tool check of <worktree>/.git (human-verified criteria; not tested here). If a write succeeds, stop and report first. A classifier denial is an environment issue, not something to work around.",
      "owner": "developer"
    },
    {
      "item": "Low finding 6 (a host grant lets the agent read its whole ticket directory, additionalDirectories): no test written. Fix it or record on the ticket why it stays.",
      "owner": "developer"
    },
    {
      "item": "Criterion 7 (npm test, risk-check, gitleaks green; full security review) is the verify and security stages.",
      "owner": "qa"
    }
  ]
}
```

# qa specify: agent-os/07-grant-hardening

Branch tests/agent-os-07-grant-hardening at c68ddad (base 061db02). One file: `apps/bridge/cells/grants-hardening.test.mjs`. Run it with `node --test apps/bridge/cells/grants-hardening.test.mjs`.

## Criterion to test map

| Criterion | Tests (describe block) |
|---|---|
| 1. Governed path and main `.git` paths get a 400 with a reason | "POST /tasks refuses a path grant on a governed path of the main checkout": 17 paths x 3 roles, plus realpath form, mixed list, `.gitignore`/docs control |
| 2. Home and system list, a test per entry | "POST /tasks refuses a path grant on a home or system path": each entry x 3 roles, absolute home form per entry, mixed list, allowed lookalikes |
| 3. Deny rules of agent-os/02 unchanged | "the deny rules of agent-os/02 stay as the second layer" (compileCeiling still emits denyAbs), plus the unchanged grants.test.mjs and grants-paths.test.mjs |
| 4. Bare `.git` entry covers the worktree `.git` file | "a bare .git entry covers the worktree's .git pointer file" (Write(.git), Edit(.git)). The live Write-tool check is human-verified |
| 5. Live probe of `.git/refs`, HEAD, update-ref | human-verified: the developer runs it and records the result on the ticket |
| 6. Low findings | `.GIT` casing: casing describe. Symlink: symlink describe. GitHub hosts: host describe. Ticket-directory read (finding 6): no test, developer fixes or records a reason |
| 7. npm test, risk-check, gitleaks, security review | verify and security stages |

## Red state

191 tests: 11 pass and 180 fail. The passing ones are controls (allowed lookalikes, a symlink to an ordinary dir, the agent-os/02 deny rules). Every failure is `expected 400, actual 201` or a missing compiled deny. Nothing fails on import or setup.

## Note for the developer

The refused-list wording and the "on or under, not above" scope are in the decisions above. `.claude/worktrees/<sibling>` grants are now 400 at POST because `.claude/**` is governed; the compile-level sibling test in grants-paths.test.mjs is unchanged.
