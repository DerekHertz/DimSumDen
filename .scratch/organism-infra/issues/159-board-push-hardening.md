# 159: Harden the board-only push and session-check (158 security follow-ups)

**Type:** feature

**Priority:** P2

**Blocked by:** 158

**Status:** ready-for-agent

**Serves:** Security findings on organism-infra/158 (`.scratch/organism-infra/handoffs/158-security.md`): the repo is public and `main` is unprotected, so an ungated push publishes before CI's gitleaks runs.

## What to build

1. **Medium: scan before a board-only push.** Before the orchestrator pushes a board-only commit to `origin/main`, run `gitleaks detect --log-opts="origin/main..main"` and refuse the push on a hit. Provide it as one script (e.g. `npm run push-board`) that also does the `git diff --name-only origin/main..main` path check, so the genome names one command. The genome wording is a gated `.claude/` edit: the developer writes it into its handoff for the user to apply.
2. **Low: validate names in fix commands.** `scripts/session-check.mjs` prints `git push -u origin <branch>` with a branch parsed from handoff prose; accept only `^[A-Za-z0-9._/-]+$` and report anything else as an invalid branch name. Same for the feature dir name.
3. **Low: push outside the board lock.** `apps/organism-infra/board-service.mjs` runs the release push (120 s timeout) while holding the board write lock; push before taking the lock, then re-run the refusal checks under the lock.

## Acceptance criteria

- [ ] The board-push script refuses when gitleaks finds a secret in the unpushed commits (test with a fixture secret) and when any path is outside `.scratch/` (test)
- [ ] session-check rejects a handoff branch name with shell metacharacters and never prints it in a fix command (test)
- [ ] A hung push during release does not hold the board write lock (test)
- [ ] The handoff contains the exact `.claude/` edit pointing the genome at the board-push script

## Comments

- **orchestrator, 2026-10-06:** Filed from 158's security pass (1 medium, 3 low; the fourth low, push of the cwd's branch, was judged sound). Not approved for dispatch yet.
- **orchestrator, 2026-10-08:** User 2026-10-08: keep the main bypass for board-only pushes but limit it to .scratch/: a direct push to main touching any path outside .scratch/ must fail. Fold into this ticket's scope.
