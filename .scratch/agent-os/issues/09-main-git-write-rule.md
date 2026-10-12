# 09: Worktree agents cannot write the main checkout's refs or HEAD

**Type:** feature

**Priority:** P1

**Class:** product

**Blocked by:** 07

**Status:** resolved

**Serves:** ADR 0021 Amendment 2 (decision 17; accepted by the user on 2026-10-11). It closes the hole the agent-os/07 live probe found: a den agent in a worktree can create, move or delete branches (`main` included) and repoint `HEAD` in the main checkout.

## What to build

Follow ADR 0021 Amendment 2 and the architect's handoff `.scratch/agent-os/handoffs/07-architect.md`; they hold the design, the live prototype results and the test list. This ticket does not restate them. In short:

- Den agents' worktrees are created detached. The agent commits on a detached HEAD and the bridge creates the branch at the agent's final commit. This amends ADR 0016 amendment 7 (one named branch per agent).
- For every worktree task, with or without grants, the sandbox and the Write and Edit tools deny `refs`, `HEAD`, `packed-refs` and `index` in the main checkout's `.git`. `objects` and the agent's own `worktrees/<own>` entry stay writable.
- A preflight makes every deny target exist before the spawn, or refuses the spawn. A deny on a missing path breaks every git command in the worktree.
- The always-on denies key on a new option for the main `.git` path, not on `root`, so the agent-os/02 tests in `grants-paths.test.mjs` keep passing.

The probe table is in `.scratch/agent-os/handoffs/07-developer.md`.

Blocked by 07 because both change the adapter; this runs right after 07 merges.

## Acceptance criteria

- [ ] Failing tests first, from the architect's list: the four denies for each role, with and without grants; the host passing the main `.git` option for a task with no grants; the preflight (targets made to exist, or the spawn refused); a detached worktree from `workspace.create`.
- [ ] `workspace.test.mjs` and `host-workspace.test.mjs` assertions of one named branch per agent are rewritten for detached worktrees, and the bridge creates the branch at the final commit, with a test.
- [ ] The agent-os/02 and agent-os/07 tests are unchanged and green.
- [ ] The live probe is repeated through the real `createClaudeRuntime` and recorded on this ticket: every ref, `HEAD`, `packed-refs`, `git update-ref`, `git branch` and `git tag` write refused; `git commit` in the worktree succeeds; main `HEAD` and refs unchanged. `git gc --auto` and `git worktree add` are run and what they print is recorded.
- [ ] A path grant on `~/.bash_profile`, `~/.bash_login`, `~/.bash_logout` or `~/.bash_aliases` gets a 400 from `POST /tasks`, with a test per entry (`RC_FILES` in `apps/bridge/cells/grant-policy.mjs`; security's medium finding in `.scratch/agent-os/handoffs/07-security.md`).
- [ ] `npm test`, risk-check and gitleaks are green apart from known failures; full `security` reviews the branch.

## Comments

- 2026-10-11, orchestrator: filed on the user's answers (2026-10-11): accept detached worktrees; build the rule in a new ticket after 07; defer the sibling-worktree deny (agent-os/10). Den-spawned agents stay off real work in this repo until 07 and this ticket have both merged. The ADR amendment is on branch `architect/agent-os-07-git-rule` (e368a13), still worded "proposed"; the user's acceptance is recorded here.
- **orchestrator, 2026-10-12:** user decision (2026-10-11): the four bash startup files security found grantable on agent-os/07 (.bash_profile, .bash_login, .bash_logout, .bash_aliases) are refused in this ticket; criterion added. agent-os/07 merged (PR #226), so this ticket is unblocked. ADR 0021 Amendment 2 merged in PR #225.
- **qa, 2026-10-12:** qa verify (light): suite from /tmp/09-tests.txt 4286/4286, 0 skipped; specify tests unedited. Criterion 4 human-verified (live probe, developer-run; the specify marker was missing from Comments). Escalated to full verify: criterion 6 is process only, and the host-level preflight refusal (502) has no test. See handoff.
- **qa, 2026-10-12:** qa full verify: QA pass. Suite 4286/4286, 0 skipped; specify tests unedited; all criteria covered or human-verified. Host preflight refusal (502) has no committed test but works (hand-probed); follow-up test suggested. risk-check hits go to full security. See 09-qa-verify-2.md.
- **security, 2026-10-12:** Security pass. No critical or high. gitleaks clean; no dep/CI change. Medium: claude-runtime.mjs:59 drops the mainGit denies silently if the repo path has a space or other non-plain char (fails open); host 502 preflight refusal has no test. Low: publish() runs rev-parse in an agent-controlled dir; pack-refs rewrite race. See 09-security.md.
