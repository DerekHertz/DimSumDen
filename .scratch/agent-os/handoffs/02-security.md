```json
{
  "ticket": "agent-os/02-grants",
  "cell": "security",
  "current_step": "Security pass at 6ca76af (no critical or high). Four medium and three low findings go to Comments without blocking. gitleaks on origin/main..6ca76af: no leaks. Questions 1 to 3 answered below.",
  "artifacts": [
    "apps/bridge/cells/claude-adapter.mjs",
    "apps/bridge/cells/host.mjs",
    "apps/bridge/cells/claude-runtime.mjs",
    "apps/bridge/cells/governance.json",
    "scripts/risk-check.mjs"
  ],
  "decisions": [
    "Verdict: Security pass. Reviewed by hand (diff 388906c..6ca76af, 12 files); no package.json or lockfile change, so no dependency gate. Bridge bind unchanged: 127.0.0.1, Host/Origin/token gates untouched, grants not in view(agent) so they are not published on the event stream.",
    "Grant validation is sound: fixed { kind, value } shape, regexes on host and path, dense arrays, at most six, no value echoed in errors, grants reach argv only as compiled settings JSON (spawn shell:false), never the prompt. IPs and private TLDs refused.",
    "Q1 accept-then-deny: true on every route an agent can write through, and POST /tasks is the only route that carries grants (POST /agents and start() pass none). A grant on <root>/.git compiles to Write/Edit deny rules (//root/.git/**, covers Write, Edit and the other edit tools) plus sandbox.filesystem.denyWrite (shell and git), for developer, qa and security; deny beats the matching allow. Checked by running compileCeiling. Not a 400. Whether it should be a 400 is the user's call (UX only: an accepted grant that can never work); security is satisfied either way.",
    "Q2 which to trust: the developer's probe. The spike line contradicts itself: it says .git is writable and gives as evidence a write under hooks that was refused. The probe is live, scripted, on a real worktree, and shows config and hooks refused for shell and git, the Write tool asking (bare) or refused (grant). CAVEAT: it tested config and hooks only, and the CLI likely blocks those two by built-in rule. It did not test .git/refs, HEAD or objects, which is what the ticket's worry is (a branch the agent moved). I tried to run that probe (shell writes to .git/probe-shell.txt, .git/refs/heads, git update-ref refs/heads/main, git branch) and the auto-mode classifier denied the script step; I did not work around it. Ticket line 29 stays unverified for refs. Recommend one more probe from a plain session or the developer.",
    "Q3 gitleaks: qa is right. gitleaks detect origin/main..6ca76af scanned 4 commits, no leaks (run with --redact; no value seen). 0c918a1e is an ancestor of origin/main (already on main); 18c30d45 is not an ancestor of the branch and sits only on tests/141-steering-approvals. Neither is from this branch.",
    "Dependency scan not needed (no manifest change). risk-check hits are expected: claude-runtime.mjs and governance.json (guardrail)."
  ],
  "failures": [
    "Bash node -e (script to derive a refs probe): denied by the auto-mode classifier, reason Irreversible Local Destruction; I wrote no probe and did not retry.",
    "Bash gitleaks with --report-path: denied (Modify Shared Resources); reran without a report file and it worked.",
    "Bash compound 'git merge-base ...; echo ...' chain: denied (classifier); reran as single commands."
  ],
  "pending": [
    {
      "item": "User decisions: (a) .git grant accepted then denied vs a 400; (b) a one-time live probe of shell writes to main .git/refs, HEAD and a git update-ref from a worktree (config and hooks are not enough); (c) the medium findings below before agent-os/05 puts a path-grant box in the Start UI.",
      "owner": "orchestrator"
    }
  ]
}
```

# security: agent-os/02-grants, branch tests/agent-os-02-grants at 6ca76af

Security pass. No critical or high finding. Findings, none blocking:

| # | Where | Severity | Why |
|---|---|---|---|
| 1 | apps/bridge/cells/claude-adapter.mjs `GRANT_PATH_RE` / `parseGrants` (line ~85) | medium | A path grant on `~/.ssh`, `~/.claude`, `~/.local/bin` or `/etc` is accepted and compiled to a write allow (confirmed by running compileCeiling). `~/.claude` lets a den agent rewrite the user's global hooks and settings, which run outside the wall; `~/.local/bin` is PATH hijack. Needs the user to type the grant (POST /tasks is token, Origin and localhost gated), so not high. Add a home-dotfile denylist (`~/.ssh`, `~/.claude`, `~/.config`, `~/.local`, `~/.git*`, shell rc files, `/etc`, `/usr`) as governed or a 400, before agent-os/05 adds the grant box. |
| 2 | apps/bridge/cells/governance.json:3 `.git/**` | medium, unverified | In the agent's own worktree `.git` is a file. `.git/**` denies children, and not obviously the `.git` file itself for the Write tool (shell is covered by denyWrite on `<wt>/.git`). An agent that can rewrite the pointer could aim it at a gitdir it built in the worktree, with a `core.fsmonitor` command that runs when the bridge or a user runs git there. Fix: add a bare `.git` entry to guardrailPaths. Live-check the Write tool on `<wt>/.git`. |
| 3 | developer-3 probe, ticket line 29 | medium | Probe covered `.git/config` and `.git/hooks` only (likely built-in CLI denies). Writes to `.git/refs`, HEAD, objects and `git update-ref` on the main checkout were not tried; that is the "branch an agent could have moved" risk. Keep the bridge distrusting main's branch until probed. |
| 4 | claude-adapter.mjs `governedUnder` (~line 197) | low | Governed-path match is case-sensitive: a grant on `<root>/.GIT` compiles with no deny (confirmed). On a case-insensitive macOS volume that is `.git`. Compare lower-cased. |
| 5 | claude-adapter.mjs denyRun matcher (~line 150) | low | Infix string rules (`Bash(*git *push*)`) are bypassed by shell quoting (`git pu''sh`) and by `gh api` merge calls. The wall is the boundary, and no ceiling lists a host. Do not grant `github.com`/`api.github.com` hosts until the CLI's own command parse is checked live. |
| 6 | claude-adapter.mjs `settingsFor` additionalDirectories | low | With a host grant the agent can Read the whole directory holding its ticket (all den-feature tickets), not just its file. Narrow if tasks carry sensitive text. |
| 7 | host.mjs `directOne` path-grant containment | low | Containment is lexical (root and realpath root); a grant through a symlink to the main checkout is not seen. User-typed grant, so low. |

Also checked and fine: forbid beats permit in the compiled rules (deny list built after allow, deny wins in the CLI), security's CI exception is limited to its own worktree, a sibling-worktree grant is wholly denied by `.claude/**`, a grant above the worktree is a 400 before any ticket is written, no secret in the diff.

Environment issues: the auto-mode classifier denied three of my Bash calls (see failures); it is the likely reason the refs probe is still undone.
