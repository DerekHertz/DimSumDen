# 07: Grant hardening: refuse grants that can never be safe, and probe `.git/refs`

**Type:** feature

**Priority:** P1

**Class:** product

**Blocked by:** None

**Status:** resolved

**Serves:** agent-os step 2 (ADR 0021). It closes the findings from the security review of agent-os/02 (`.scratch/agent-os/handoffs/02-security.md`, pass at 6ca76af, PR #222) before agent-os/05 puts a grants table in the Start box.

## What to build

A path grant that could never be safe is rejected when the task is created, with a reason the Start box can show. Today such a grant is either accepted and then denied, or accepted and allowed.

- **400 for a governed path (user, 2026-10-11).** A path grant on any governed path, the main checkout's `.git` included, gets a 400 from `POST /tasks`. Today it is accepted and then denied by the governed list. The deny rules stay as the second layer.
- **Home and system paths (medium).** Path grants on `~/.ssh`, `~/.claude`, `~/.local/bin` and `/etc` are accepted today and become write allows (`GRANT_PATH_RE` and `parseGrants` in `claude-adapter.mjs`). Refuse them with a 400. Decide the full list with security's handoff in hand: home dotfiles and system directories at least.
- **The worktree's `.git` pointer file (medium, unverified).** `.git/**` in `apps/bridge/cells/governance.json` may not cover a worktree's `.git` file for the Write tool. A repointed gitdir could run `core.fsmonitor` when git runs there. Add a bare `.git` entry and check it live.
- **Live probe of `.git/refs` (medium; user, 2026-10-11: the developer runs it).** The agent-os/02 probe tried `.git/config` and `.git/hooks` only. Probe writes to the main checkout's `.git/refs` and `HEAD`, and `git update-ref`, from a worktree, with a real child in a throwaway repo the way agent-os/02's `.git/config` probe ran (`02-developer-3.md`). Record the result on this ticket. If a write succeeds, stop and report before building anything else.
- **Low findings.** Fix these, or record on this ticket why each one stays:
  - `.GIT` casing is not matched; the matcher is case-sensitive and macOS volumes are not.
  - Containment is lexical, so a symlink to the main checkout is not seen.
  - A host grant lets the agent read its whole ticket directory.
  - `Bash(*git *push*)` rules are bypassed by shell quoting, and `gh api` can merge. The wall is the boundary, so GitHub hosts must not be grantable yet.

Ticket line 29 of agent-os/02 says the main checkout's `.git` is writable from a worktree. The agent-os/02 live probe did not reproduce that for `config` and `hooks`; security trusts the probe.

Security's own attempt at the refs probe was denied by the auto-mode classifier. If the developer's probe is denied too, report it as an environment issue; do not work around it.

## Acceptance criteria

- [ ] Failing tests first: a path grant on each governed path, and on the main checkout's `.git` and paths under it, gets a 400 from `POST /tasks` with a reason.
- [ ] A path grant on `~/.ssh`, `~/.claude`, `~/.local/bin`, `/etc` and each other entry of the agreed list gets a 400, with a test per entry.
- [ ] The deny rules of agent-os/02 are unchanged: the governed list still denies when a grant reaches the adapter by another route.
- [ ] A bare `.git` entry covers the worktree's `.git` file, with a test and a live check recorded here.
- [ ] The live probe of `.git/refs`, `HEAD` and `git update-ref` is recorded on this ticket with its result.
- [ ] Each low finding is fixed with a test, or has a recorded reason to stay.
- [ ] `npm test`, risk-check and gitleaks are green apart from known failures; full `security` reviews the branch.

## Comments

- 2026-10-11, orchestrator: filed after agent-os/02 merged (PR #222). User decisions (2026-10-11): merge agent-os/02 and fix the findings here; a grant on a governed path is a 400 up front; the developer runs the `.git/refs` probe.
- 2026-10-11, orchestrator: user decision (2026-10-11) on the refused list for criterion 2: security's list from `02-security.md` finding 1. A path grant on `~/.ssh`, `~/.claude`, `~/.config`, `~/.local`, `~/.git*`, a shell rc file, `/etc` or `/usr` (and paths under each) gets a 400, with a test per entry. Relay approved by the user; first cell qa specify.
- **developer, 2026-10-12:** Live refs probe (developer, 2026-10-11): from a worktree, sandboxed shell WROTE main .git/refs/heads/<new> and .git/HEAD, and git update-ref / git branch succeeded. Write/Edit tools to <wt>/.git are denied. Stopped per ticket; no code written. See handoffs/07-developer.md.
- **developer, 2026-10-12:** live probe: main .git/refs and HEAD writable from a worktree; user decision needed before building
- 2026-10-11, orchestrator: user decisions (2026-10-11) after the probe. (1) `architect` designs the main-`.git` write rule before any code: which writes a worktree agent keeps (its own commits need `.git/objects`, its `.git/worktrees/<own>` entry and its own branch ref) and which are denied (other refs, `HEAD`, `config`, `hooks`), with the cause of the open write verified, recorded under ADR 0021. Status moved from `blocked` to `ready-for-agent` for that dispatch; the developer continues on `tests/agent-os-07-grant-hardening` once the design is on this ticket. (2) Den-spawned agents stay off real work in this repo until this ticket merges. Relay cells are not affected; they do not run through the bridge.
- **architect, 2026-10-12:** architect: cause confirmed in part (CLI allows main .git; adapter denies nothing there without grants, and root alone would not add refs denies). Rule: agents commit on a detached HEAD; sandbox denies main .git refs, HEAD, packed-refs, index (live-proved; named-branch own-ref cannot be expressed). ADR 0021 Amendment 2 on branch architect/agent-os-07-git-rule (e368a13), proposed. Open user question: accept detached worktrees (changes ADR 0016 amendment 7). See handoffs/07-architect.md.
- 2026-10-11, orchestrator: architect design returned (`07-architect.md`; ADR 0021 Amendment 2 on branch `architect/agent-os-07-git-rule`). User decisions (2026-10-11): accept detached worktrees for den agents; build the main-`.git` rule in agent-os/09, after this ticket; defer the sibling-worktree deny (agent-os/10, parked). This ticket keeps its written scope: the 400s, the bare `.git` entry and the low findings. Criterion 5 is met by the probe recorded above. The architect confirmed `grants-hardening.test.mjs` needs no change. Status set back to `ready-for-agent` (the architect released at `in-review`) for the developer on `tests/agent-os-07-grant-hardening`. Den-spawned agents stay paused until 07 and 09 have both merged.
- **developer, 2026-10-12:** Live bare .git check (real haiku child, throwaway worktree): Write/Edit to <wt>/.git denied, shell write Read-only, file unchanged; same result on old code, so CLI already protects it and the bare entry is belt and braces. Ticket-dir read stays (CLI takes dirs only; see 07-developer-2.md). Extra refused entries beyond the decided list: more rc files and system dirs.
- **qa, 2026-10-12:** qa light verify: steps 1, 2, 4 pass; escalated to full verify on criterion 6 (reasons for ticket-dir read and Bash quoting are in 07-developer-2.md, not on the ticket). Details: handoffs/07-qa-verify.md
- 2026-10-11, orchestrator: user decision (2026-10-11): keep the developer's extra refused entries (rc files `.zlogout`, `.login`, `.logout`, `.kshrc`, `.cshrc`, `.tcshrc`; system directories `bin`, `sbin`, `lib`, `lib32`, `lib64`, `boot`, `root`, `sys`, `proc`, `dev`, `system`, `library`, `/private/etc`). ADR 0021 Amendment 2 merged (PR #225).
- 2026-10-11, orchestrator: criterion 6 reasons, copied from the developer's report so they stand on the ticket. (a) Ticket-directory read stays: the CLI's `additionalDirectories` takes directories only, the directory holds only den tickets, the shell sandbox already limits reads to the one ticket file, and a fix would break the unchanged `grants-paths.test.mjs`. (b) Shell-quoting bypass of `Bash(*git *push*)` and `gh api`: not fixed in the rules; GitHub hosts (`github.com`, `*.github.com`) are refused as grants with tests, so the wall blocks it. qa light verify gave no verdict and escalated to full verify on this criterion; full verify judges whether these reasons hold.
- **qa, 2026-10-12:** qa full verify: QA pass at 69bdee9. Suite 4225 pass, 0 skipped; specify tests unchanged; every criterion mapped or human-verified; both criterion 6 reasons hold (note for security: a non-GitHub git host stays grantable). Details: handoffs/07-qa-verify-2.md
- **security, 2026-10-12:** Security pass at 69bdee9. No critical/high. risk-check hit on governance.json only (expected); gitleaks clean; no dep/CI change. Medium: grant-policy.mjs:22 RC_FILES omits .bash_profile/.bash_login/.bash_logout/.bash_aliases (probed, accepted); follow-up, not a bounce. Low: resolveReal check-time only (accepted); non-GitHub git hosts grantable (no creds reachable in sandbox); ~/.aws, .gnupg, .netrc grantable (outside decided list). Details: handoffs/07-security.md
