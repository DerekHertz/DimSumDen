```json
{"ticket": "organism-infra/48-scripted-usage-rows", "cell": "qa", "mode": "verify", "current_step": "QA pass", "artifacts": [],
 "decisions": ["QA pass at 52d7b6b: 341/341 tests, 0 skipped; test diff since bf29f8f is only the claimAndReady(orchestrator) line", "resolved row is appended after the release transaction commits; the --pr check throws before any write, so a refused release writes no row"],
 "failures": [],
 "pending": [{"item": "note: bounces keyed on exact feature/ticket slug; a renamed ticket loses earlier verdicts (count 0), and a re-resolve after reopening writes a second row with cumulative bounces. Neither blocks.", "owner": "orchestrator"}]}
```

## State

QA pass. Criteria: resolved row (usage-rows tests), log-cell valid/reject tests, ADR 0008 decision 12 plus text-match test.

## What changed

Nothing; verify only.

## Decisions made

See State block.

## Next step

security review.

## Suggested skills

none

## Gotchas

Refs are exact file slugs, so a short-ref mismatch cannot resolve a ticket; it errors. Files outside scope: none (board-service.mjs, board.mjs, log-cell.mjs, ADR 0008, test).
