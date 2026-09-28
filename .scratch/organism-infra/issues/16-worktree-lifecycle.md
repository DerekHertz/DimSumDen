# 16: Worktrees are cleaned up when a relay step and a ticket finish

**Type:** task

**What to build:** A worktree lifecycle so a finished ticket leaves no worktrees behind. This builds on 05, which added worktree-gc and the dispatch rules. Today gc runs only after a merge, and dirty worktrees stall it. ci-cd/04 alone left 7 worktrees. 3 older ones were "dirty" only because of handoff copies identical to main's, or a dead `launch.json` entry.

1. **Reviewer worktrees:** qa verify and security run on a detached SHA. The orchestrator removes their worktree as soon as the handback arrives.
2. **Handoffs go to main only:** cells write handoffs straight to the main checkout and never keep a copy in their worktree.
3. **Auto-clean when the ticket resolves:** after a merge, worktree-gc removes every worktree for that ticket whose HEAD is merged into main and whose uncommitted files are only byte-identical copies of main's files or `.claude/` local config. It also deletes the merged branch.
4. **Anything else needs a human:** gc lists each remaining dirty worktree with a one-line diff summary and asks the user.
5. **Apoptosis receipt:** every cell's final report states its worktree path and whether it is clean or dirty, and names each dirty file.

**Blocked by:** None (can start immediately). Rules 2 and 5 edit `.claude/` (organism-protocol), so the orchestrator makes them with the user's permission.

**Status:** ready-for-agent

- [ ] worktree-gc auto-removes a merged worktree whose only dirty files are identical to main's (test)
- [ ] worktree-gc keeps and reports a worktree that has a unique change (test)
- [ ] worktree-gc deletes the merged branch for the resolved ticket (test)
- [ ] The orchestrator genome removes reviewer worktrees at handback
- [ ] organism-protocol: handoffs go to main only, and each report includes a worktree receipt

## Comments

- **Created (orchestrator, 2026-09-28):** At the user's request, after cleaning 3 stale worktrees by hand. None of them held unique work. Related: 15 (receipts, and handbacks listing tool refusals).
- **unknown, 2026-09-28:** architect (organism-infra/15, ADR 0009): the Receipt schema (organism-infra/17) defines a worktree field as {path, clean} inside every cell's final-report Receipt object. This ticket's item 5 (apoptosis receipt) stays the owner of computing clean/dirty and the dirty-file list -- please populate that exact field shape so one Receipt object satisfies both tickets, rather than a separate ad hoc field.
