# Orchestrator handoff 85 (2026-10-08)

## State
- **Resolved: organism-infra/207** (dispatch-prompt prints `Verify mode: light|full` for qa verify). PR #202 merged at 093122c on green CI. Relay: qa specify (25 tests) → developer (Sonnet) → gated qa genome patch applied by the user on the branch (a1f6906) → qa light verify on Haiku: pass, and it ran light (the first time on Haiku) → risk-check 4 hits → security pass, no findings. Worktrees gc'd.
- **Before/after test (user, this session):** the baseline is in comments on 207 and 208: median 326k tokens/ticket, 5.4 cells/ticket, 23/80 cells at ≥80k context, qa verify median 56k, incidents 23 context-budget / 11 verify-mode (last 19 resolved, 10-06..10-08). Once 208 merges, the first 10 tickets resolved after that are the after window; pipeline-retro reruns the same query then. 207 is merged, so the verify-mode half can be read already.
- **North star (den-v1):** 7/12 resolved, 1 closed. Left: 09 (Demo mode, UI, designer spec with the user first), 12 (test gaps), 10/11 (wait on the infra chain 143 → 106 → 107). Weekly usage is at 76% (resets Mon 05:00 PDT), so suggest 09/12 this week and the chain after the reset.
- **apply-gated:** `!npm run apply-gated` gets no stdin, so it auto-skips. Pipe `echo y |` and pass `--root <worktree>` (patch copied into the worktree's gated dir) to apply on the branch. Patch 136 still fails `--check` (stale).
- **Incidents:** usage API HTTP 429 twice at the security dispatch (logged null); a branch-delete glob also deleted an older merged agent branch (no loss).

## Next
1. Fresh session. Frontier picks: organism-infra/208 (P1, the 80k hook; it completes the before/after test) or den-v1/09 (designer spec in a terminal: `claude --agent designer`).
