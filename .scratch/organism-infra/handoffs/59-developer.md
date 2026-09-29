```json
{
  "ticket": "organism-infra/59-handoff-error-shows-skeleton",
  "cell": "developer",
  "current_step": "implemented in board-service.mjs; qa's 12 tests pass; full npm test 795/800 with only the 5 expected browser smoke failures; committed and pushed on organism-infra/30-handoff-skeleton",
  "artifacts": ["apps/organism-infra/board-service.mjs", "branch organism-infra/30-handoff-skeleton"],
  "decisions": [
    "stateSkeleton/claimSkeleton helpers append a fenced json skeleton to the 'must name ticket' and 'no valid handoff State block' errors; cell/mode come from the claim lock (mode key absent when unmoded; <cell> placeholder when no lock)",
    "Release gate is now newStatus !== blocked (covers --keep-status, which has no newStatus); removed HANDOFF_GATED_STATUSES; --force override event logged for any non-blocked release"
  ],
  "failures": [],
  "pending": [
    {"item": "qa verify, then security review, then merge", "owner": "orchestrator"}
  ]
}
```

## Summary

Skeleton printed on both rejection sites; release gate extended to all statuses except blocked. No test edits.

- **Renumbered (orchestrator, 2026-09-29):** was cloud organism-infra/30; the local board used that number for a different ticket.
