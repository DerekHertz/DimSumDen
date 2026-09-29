```json
{"ticket":"organism-infra/49-verdict-roles-and-claim-status","cell":"developer","current_step":"implemented, in-review","artifacts":["apps/organism-infra/board-service.mjs","scripts/log-cell.mjs","scripts/log-resolved.mjs","docs/adr/0008-board-service.md (decision 13)"],"decisions":["appendUsageLine uses O_NOFOLLOW; shared by board and log-resolved","release wraps append failure in a BoardError naming usage.jsonl and the log-resolved command","--pr refused up front for any non-resolved release"],"failures":[],"pending":[{"item":"verify","owner":"qa"},{"item":"security review","owner":"security"}]}
```

## Summary

All 21 tests in scripts/verdict-roles.test.mjs pass unedited; full suite 362/362. ADR 0008 gained decision 13. .claude/ untouched (organism-protocol and genomes may want to mention log-resolved; orchestrator's call).
