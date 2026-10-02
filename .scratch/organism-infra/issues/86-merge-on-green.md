# 86: merge-on-green script for the orchestrator

**Type:** feature

**Priority:** P1

**What to build:** The orchestrator merged PR 96 with a red test job by chaining `gh pr checks --watch` and `gh pr merge` without checking the result, and hid a release failure behind `tail -1`. Add `scripts/merge-on-green.mjs --pr <n>` that reads `gh pr checks <n>` as data, refuses (non-zero exit, names the failing or pending checks) unless every required check passed, refuses if `git merge-tree --write-tree origin/main <head>` reports conflicts, and otherwise runs the merge and prints the merge commit. `gh` calls go through an injectable runner so tests need no network. Update the orchestrator genome's stage 5 to merge only through this script (a `.claude/` edit: developer writes the diff into its handoff for the user to apply).

**Blocked by:** none

**Status:** ready-for-agent

- [ ] A PR with any failing check is refused and nothing is merged (test)
- [ ] A PR with a pending check is refused (test)
- [ ] A conflicted PR is refused (test)
- [ ] An all-green, clean PR is merged and the script exits 0 (test)
- [ ] The genome diff for stage 5 is in the developer handoff

## Comments

- **Created (orchestrator, 2026-09-30):** pipeline-retro session 15, tool ci, count 2 (PR 96 red merge, batch A hidden release error).

- **orchestrator, 2026-10-01:** Raised to P1 for 10-02 (user): pipeline saver.
