```json
{
  "ticket": "organism-infra/28-review-claims-keep-in-review",
  "current_step": "developer done: tests green, released at in-review",
  "artifacts": [
    "feature/organism-infra-28-review-claims @ b39f990",
    "apps/organism-infra/board-service.mjs"
  ],
  "decisions": [
    "claim keeps in-review when from-status is in-review and cell is security, or qa in verify mode; event to_status and return value reflect actual status"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Update docs/adr/0008-board-service.md decision 9 (claim on in-review by security/qa verify keeps in-review); ADR edit is a brain gate",
      "owner": "orchestrator"
    },
    {
      "item": "Check .claude/ skills and docs/agents/issue-tracker.md for text saying claim always sets claimed",
      "owner": "orchestrator"
    }
  ]
}
```

# 28 developer handoff

Branch feature/organism-infra-28-review-claims @ b39f990. Full npm test: 243 pass, 0 fail (incl. 3 in board-review-claims.test.mjs).

Change: `claim` in board-service.mjs computes keepInReview (from-status in-review, cell security or qa+verify); status unchanged then, otherwise claimed. Developer claim on ready-for-agent still gives claimed.

Not done (gates): ADR 0008 and any .claude/ edits.

jg vs grep: jg 1 call, grep 2 calls.
