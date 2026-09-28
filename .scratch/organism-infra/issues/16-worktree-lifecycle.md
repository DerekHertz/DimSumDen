# 16: Worktrees are cleaned up when a relay step and a ticket finish

**Type:** task

**What to build:** A worktree lifecycle so a finished ticket leaves no worktrees behind. This builds on 05, which added worktree-gc and the dispatch rules. Today gc runs only after a merge, and dirty worktrees stall it. ci-cd/04 alone left 7 worktrees. 3 older ones were "dirty" only because of handoff copies identical to main's, or a dead `launch.json` entry.

1. **Reviewer worktrees:** qa verify and security run on a detached SHA. The orchestrator removes their worktree as soon as the handback arrives.
2. **Handoffs go to main only:** cells write handoffs straight to the main checkout and never keep a copy in their worktree.
3. **Auto-clean when the ticket resolves:** after a merge, worktree-gc removes every worktree for that ticket whose HEAD is merged into main and whose uncommitted files are only byte-identical copies of main's files or `.claude/` local config. It also deletes the merged branch.
4. **Anything else needs a human:** gc lists each remaining dirty worktree with a one-line diff summary and asks the user.
5. **Apoptosis receipt:** every cell's final report states its worktree path and whether it is clean or dirty, and names each dirty file.

**Blocked by:** None (can start immediately). Rules 2 and 5 edit `.claude/` (organism-protocol), so the orchestrator makes them with the user's permission.

**Status:** resolved

- [ ] worktree-gc auto-removes a merged worktree whose only dirty files are identical to main's (test)
- [ ] worktree-gc keeps and reports a worktree that has a unique change (test)
- [ ] worktree-gc deletes the merged branch for the resolved ticket (test)
- [ ] The orchestrator genome removes reviewer worktrees at handback
- [ ] organism-protocol: handoffs go to main only, and each report includes a worktree receipt

## Comments

- **Created (orchestrator, 2026-09-28):** At the user's request, after cleaning 3 stale worktrees by hand. None of them held unique work. Related: 15 (receipts, and handbacks listing tool refusals).
- **unknown, 2026-09-28:** architect (organism-infra/15, ADR 0009): the Receipt schema (organism-infra/17) defines a worktree field as {path, clean} inside every cell's final-report Receipt object. This ticket's item 5 (apoptosis receipt) stays the owner of computing clean/dirty and the dirty-file list -- please populate that exact field shape so one Receipt object satisfies both tickets, rather than a separate ad hoc field.
- **qa, 2026-09-28:** qa specify: 3 failing tests added to scripts/worktree-gc.test.mjs on branch claude/organism-infra-16-tests (commit 03bd47b, pushed). See .scratch/organism-infra/handoffs/16-qa-specify.md for the criterion-to-test map and run instructions.
- **qa, 2026-09-28:** qa specify done; ready for developer on claude/organism-infra-16-tests
- **unknown, 2026-09-28:** correcting prior release: qa specify never sets ticket status itself; ready-for-agent so a developer can claim, not blocked
- **developer, 2026-09-28:** developer: 3 red tests now green (14/14 in scripts/worktree-gc.test.mjs; full suite 204/204). Kept qa's forgiveness-rule assumption (untracked + byte-identical-to-main, or under .claude/) as specified -- ticket text matches it, so no contradiction. Commit d83a1fc on claude/organism-infra-16-tests (pushed). Handoff: .scratch/organism-infra/handoffs/16-developer.md. Did not touch .claude/ (items 4-5 remain the orchestrator's). Ready for qa verify.
- **qa, 2026-09-28:** QA pass (full verify, commit d83a1fc detached checkout). scripts/worktree-gc.test.mjs 14/14, full npm test 204/204. qa-specify test file (03bd47b) byte-identical at d83a1fc -- no test weakened/deleted. All 3 code criteria have passing tests at real seams (file/branch existence, report text), not tautological. Judged developer's 3 flagged gaps as follow-on, not blockers: (1) staged-tracked-file diff-summary misreport -- cosmetic only, isForgivableEntry never treats a tracked (non-?? ) entry as forgivable regardless of staged/unstaged, so disposition (DIRTY vs REMOVABLE) is unaffected, only the numstat text could read +0/-0; (2) binary numstat rendering as (+-/--) -- same, cosmetic text only; (3) --force on worktree remove now applies to the plain-clean path too -- harmless, since --force is only reached after disposition is already REMOVABLE (unforgivable.length===0 and isAncestorOfMain), so it can't force-remove a worktree with real unforgivable dirt. Recommend a follow-on ticket for (1)/(2) if diff-summary precision matters later. .claude/ items 4-5 out of scope per ticket note, left to orchestrator.
- **qa, 2026-09-28:** qa full verify pass
- **unknown, 2026-09-28:** security: Security pass (commit d83a1fc). Verified: unmerged work and the main checkout can never be removed (REMOVABLE requires no unforgivable dirt AND ancestor-of-main; main checkout excluded from candidates before any logic runs). No shell/argument injection -- every git call is execFileSync with array args, no shell:true. Byte-identical comparison: no exploitable path traversal (git status only emits in-tree relative paths; git show resolves against tree objects not the filesystem); flagged one low-severity defense-in-depth note (no explicit worktree-root confinement check on the two readFileSync calls) as a Comment, not a blocker. --force widening confirmed safe: only reached when disposition is already REMOVABLE, so it can never force-delete a worktree with real unforgivable dirt. No new dependencies, no secrets in the diff, no CI/workflow changes. Full handoff: .scratch/organism-infra/handoffs/16-security.md. Ready for orchestrator merge decision.
