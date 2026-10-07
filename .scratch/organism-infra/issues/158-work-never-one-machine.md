# 158: Work never stays on one machine

**Type:** feature

**Priority:** P1

**Blocked by:** none

**Status:** resolved

**Serves:** Testbed friction: the user switches between the MacBook and the WSL PC, and work left local on one machine stalls the relay on the other. Incidents (usage.jsonl): 2026-09-29T22:28:33Z and 2026-09-29T22:37:50Z (board fork), 2026-10-05T05:03:56Z (Mac held an unpushed session), 2026-10-05T06:10:05Z (local main 3 ahead), and the 2026-10-06 incident on organism-infra/140 (tests branch d92cf29 and developer commit db9fc50 only on the MacBook).

## What to build

1. **Release pushes the branch.** `board release` pushes the releasing cell's branch (tests branch or feature branch) to `origin` with upstream tracking before it writes the release. If the push fails, it refuses with the git error and leaves the claim in place. A cell on a detached HEAD (reviewers) has no branch to push and is unaffected.
2. **End-of-session check.** The handoff step and `npm run next-session` list, and refuse on: local `main` ahead of `origin/main`; uncommitted or untracked files under `.scratch/` board directories; any ticket at `in-progress` or `in-review` whose branch named in its latest handoff is missing from `origin` or behind the local branch. The refusal prints each item and the command that fixes it.
3. **Board-only commits push without a gate.** A commit on `main` that touches only `.scratch/` may be pushed straight to `origin/main` by the orchestrator. Code still goes through a PR, and merges stay a pass gate. The orchestrator genome and `organism-protocol` wording for this is a gated `.claude/` edit: the developer writes the exact edit into its handoff, and the user applies it.

## Acceptance criteria

- [ ] `board release` pushes the cell's branch and records the release only after the push succeeds (test with a local bare remote)
- [ ] A failed push refuses the release with the git error and keeps the lock (test)
- [ ] Release from a detached HEAD does not push and still succeeds (test)
- [ ] The end-of-session check refuses on each of the three conditions and prints the fixing command for each (tests with a fixture repo)
- [ ] `next-session` runs the same check and refuses the same way (test)
- [ ] The handoff contains the exact `.claude/` edits for the board-only push rule

## Comments

- **orchestrator, 2026-10-06:** Filed from a grilling session on the user's ask ("make sure work doesn't stay hidden on a single machine since I switch from macbook to my pc"). User approved all three parts and dispatch of qa specify first, ahead of 145 (user, 2026-10-06). Leftover `worktree-agent-*` branches are out of scope (worktree-gc owns them).
- **qa, 2026-10-06:** qa specify done: tests on tests/158-work-never-one-machine (80d1d9b); map in handoffs/158-qa-specify.md. Criterion 6 (.claude/ wording) is human-verified and depends on the gated edit.

**orchestrator (2026-10-06), user decisions on qa specify's open points:**
- `.scratch/usage.jsonl` (append-only log) is ignored by the end-of-session check; it never blocks.
- A release on `main` (orchestrator) skips the push; the end-of-session check flags "main ahead of origin" with the fix command.
- "The handoff step" = the `handoff` skill wording runs `session-check`. That is a gated `.claude/` edit: the developer writes it, with the genome edit, into its handoff for the user to apply.
- Tests branch `tests/158-work-never-one-machine` (80d1d9b) is pushed to origin.
- **developer, 2026-10-06:** developer done: tests green, commit 9a86ebb on 158-work-never-one-machine; handoffs/158-developer.md; gated patch .scratch/_handoffs/gated/158-board-only-push-and-session-check.patch awaits the user (!npm run apply-gated).
- **qa, 2026-10-06:** Light verify complete: all 2023 tests pass, no assertions loosened, all criteria mapped to tests, criterion 6 human-verified in gated patch.
- **security, 2026-10-06:** Security pass. No critical or high. medium: .claude/agents/orchestrator.md:109 board-only push to public unprotected main has no pre-push secret scan (CI gitleaks runs only after push); suggest gitleaks before push. low: scripts/session-check.mjs:158-161 branch from handoff prose unvalidated in printed fix command; board-service.mjs:1105 push runs under board lock. gitleaks clean. Handoff: 158-security.md
- **orchestrator, 2026-10-06:** merged f5da3ee; security medium + 2 lows filed as 159
