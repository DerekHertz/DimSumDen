```json
{
  "ticket": "organism-infra/28-review-claims-keep-in-review",
  "current_step": "qa verify: pass",
  "artifacts": [
    "feature/organism-infra-28-review-claims @ b39f990"
  ],
  "decisions": [
    "QA pass: 243/243 tests; c57f46e tests unchanged (diff c57f46e..b39f990 touches only board-service.mjs)"
  ],
  "failures": [],
  "pending": [
    {
      "item": "security review",
      "owner": "security"
    },
    {
      "item": "ADR 0008 decision 9 and issue-tracker.md wording (brain gate)",
      "owner": "orchestrator"
    }
  ]
}
```

# 28 qa verify

QA pass. npm test 243 pass, 0 fail, 0 skipped. Specify tests untouched. Diff matches criteria: security and qa+verify claims on in-review keep in-review; event to_status and return value reflect actual status; other claims still set claimed.

jg vs grep: jg 0 calls, grep 0 calls (diff read directly).
