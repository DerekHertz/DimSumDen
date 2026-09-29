```json
{"ticket": "organism-infra/48-scripted-usage-rows", "cell": "developer", "current_step": "implemented; 25 of 26 usage-rows tests green, 1 test appears wrong", "artifacts": ["apps/organism-infra/board-service.mjs", "apps/organism-infra/board.mjs", "scripts/log-cell.mjs", "docs/adr/0008-board-service.md"],
 "decisions": ["resolved row appended after the release commits; pr/Type check runs before any write", "log-cell root is $ORGANISM_ROOT else cwd", "ADR 0008 decision 12 added; ADR 0010 does not name who writes cell/resolved rows so unchanged"],
 "failures": [{"what": "test 'non-code ticket (Type: design) may resolve without --pr' fails", "why": "it claims as architect then resolves; ticket 24 rule (ADR 0008 decision 9) allows only orchestrator to resolve, force does not bypass"}],
 "pending": [{"item": "qa fixes that test to claim as orchestrator (claimAndReady(fx, \"orchestrator\")); code already handles pr:null for design", "owner": "qa"}]}
```

## State

Partial: full suite 340 pass, 1 fail (the mis-specified test above). Branch worktree-agent-aad74981dfcf8f9c3, commit 58cefd9, built on qa's bf29f8f.

## What changed

board comment --verdict pass|bounce (recorded on the comment event; others refused). board release --pr N (positive integer; required for Type feature or bug, checked before any write). Resolved row {kind, ts, ticket, pr, bounces} appended to usage.jsonl after commit. scripts/log-cell.mjs. ADR 0008 decision 12.

## Decisions made

See State block.

## Next step

qa corrects the one test, then verify.

## Suggested skills

tdd

## Gotchas

I verified the design-ticket path would work by reading the code, not by running a corrected test.
