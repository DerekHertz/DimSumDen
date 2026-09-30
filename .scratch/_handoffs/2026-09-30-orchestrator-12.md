```json
{"ticket": "organism-infra (Jev routing)", "cell": "orchestrator", "mode": "session",
 "current_step": "session end at ~125k context (new 150k cap); main at 0268de2 plus this board PR",
 "artifacts": ["https://github.com/DerekHertz/DimSumDen/pull/92", "https://github.com/DerekHertz/DimSumDen/pull/93", "https://github.com/DerekHertz/DimSumDen/pull/94", "https://github.com/DerekHertz/DimSumDen/pull/95"],
 "decisions": ["user: reset WSL main to origin (local commit duplicated #73)", "user: 77 publishes and absorbs 46", "user: Cursor session has no 5-hour reading; log visible tokens labelled source cursor session", "user: genome jev exit-code wording updated (refusal exits 2)", "user: orchestrator context cap 100-150k (stop new tickets at 120k)", "user: live-testing plan = route advisory-live (79) and jg for scout (80); compaction stays shadow", "user: scout jg line applied"],
 "failures": ["qa and security left handoff copies in worktrees (ticket 78)", "Cursor subagents report no token counts, so log-cell skipped", "Grep tool ignores worktree paths outside the workspace; cells use rg"],
 "pending": [
  {"item": "72 wake gate prelude shadow: unblocked (67, 71, 77 resolved); must always pass author", "owner": "orchestrator"},
  {"item": "79 route advisory-live, with scope added from 71 (orderRow wiring, priority-verdict rows); genome and ADR 0015 edits need user yes", "owner": "orchestrator"},
  {"item": "68 open: verdicts recorded (tier and verify stay shadow); criterion 2 needs jev-report to print bounce cause and per-criterion PASS/FAIL", "owner": "orchestrator"},
  {"item": "78 board handoff refuses worktree draft", "owner": "orchestrator"},
  {"item": "67 follow-ups: ADR 0010/0014/0015 edits (architect, user yes)", "owner": "architect"},
  {"item": "80 Lows: jg.mjs fail-safe when checkout null; bash-guard inert until 52 registers the hook", "owner": "orchestrator"},
  {"item": "70 Low: no-bounce ticket still calls Jev (optional)", "owner": "orchestrator"}]}
```

# Handoff: orchestrator session 12 (Cursor on WSL)

Merged 77 (#92), 70 (#93), 71 (#94) and 80 (#95); resolved 46, 67 and 69. Next: 72, then 79. In Cursor, subagents run in the main checkout, so create a detached worktree per cell (`git worktree add --detach /home/dhertzell/dsd-<NN>-<hop> <sha>`) and have the cell run `cell-start.mjs` in it. Tell each cell to draft its handoff under `/tmp`. Fix rounds need round-numbered handoff names (`<NN>-developer-2.md`).
