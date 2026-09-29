```json
{"ticket": "organism-infra/50-verdict-lock-and-failure-rows", "cell": "orchestrator", "mode": "merge",
 "current_step": "user approved; merged PR #39; resolving",
 "artifacts": ["apps/organism-infra/board-service.mjs", "scripts/log-cell.mjs", "docs/adr/0008-board-service.md"],
 "decisions": ["qa verdict only under a qa verify lock"],
 "failures": ["qa specify skipped claim/handoff (resumed)", "cell-start --branch failed on existing branch"],
 "pending": [{"item": "51: handoff validation at publish, log-cell handoff check, cell-start existing branch", "owner": "orchestrator"}]}
```

# Handoff: orchestrator, 50 merge

PR https://github.com/DerekHertz/DimSumDen/pull/39 merged with the user's yes. Security LOWs: resolved row on release lacks the duplicate check (fold into 51 or a later ticket).
