# 82: Batch relay: one developer, one branch, one PR for same-area tickets

**Type:** task

**Priority:** P1

**What to build:** Rules that let the orchestrator group small tickets that touch the same area into one batch, run by one relay (one qa specify, one developer, one qa verify, one risk-check, one PR).

Source: user decision, 2026-09-30.

**Blocked by:** none

**Status:** resolved

- [ ] The orchestrator genome and `organism-protocol` describe a batch: the orchestrator names it and lists its tickets, and each ticket is claimed by the batch's cell and resolved with the same PR.
- [ ] A batch holds tickets whose files overlap with each other but not with any other in-flight branch; the two-cell limit counts a batch as one cell.
- [ ] One bounce on any ticket in the batch bounces the whole batch and counts toward fails-twice for each of its tickets.
- [ ] qa specify writes tests for every ticket in the batch and maps each criterion to its ticket.
- [ ] Every edit is under `.claude/`: the developer writes the exact edit into its handoff and the user applies it after organism-infra/72 merges (72 also edits the orchestrator genome).

## Comments
- **Created (orchestrator, 2026-09-30):** Part of batch A (78, 66, 60, 32, 54, 81, 82).
- **developer, 2026-09-30:** Batch A developer done on feat/batchA-board-friction at c9f8ab0 (npm test 1208/1208). .claude-only: edits scripted in /tmp/batchA-claude-edits.mjs, not applied. See handoffs/82-developer.md
- **qa, 2026-09-30:** QA pass. 1208/1208. All criteria are .claude/ edits (human-verified by QA specify decision). Criteria 1-5 all met in commit 1191686: orchestrator genome has a new Batches section (lines +58-67) describing batch naming, file-overlap rule, two-cell limit, each-cell-claims, and bounce-propagation. organism-protocol SKILL.md has a Batches paragraph. No automated tests (QA specify decision: doc/.claude tickets have no tests). Test files unchanged from f7be419.
- **security, 2026-09-30:** Security pass: no critical/high findings; gitleaks 0 leaks; npm audit 0 vulns; all shell-outs use execFileSync/spawnSync without shell:true with no untrusted args; refuseWorktreeDraft path guard correct; no new dependencies.
