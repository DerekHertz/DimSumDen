```json
{"ticket": "organism-infra/48-scripted-usage-rows", "cell": "qa", "mode": "specify", "current_step": "fixed the pr:null test claim identity; 26/26 and full suite green",
 "artifacts": ["scripts/usage-rows.test.mjs"],
 "decisions": ["the Type: design pr:null test claims as orchestrator, since ADR 0008 decision 9 lets only an orchestrator claim resolve; no assertion changed"],
 "failures": [],
 "pending": []}
```

## State

Done: one-line test fix, no assertion loosened.

## What changed

Branch qa-48-fix-orchestrator-claim, commit 52d7b6b on top of developer 58cefd9. Only the claimAndReady call in the Type: design test changed.

## Decisions made

None beyond the State block.

## Next step

orchestrator continues the relay (security review).

## Suggested skills

none

## Gotchas

The pr:null test asserts exactly one resolved row with pr strictly null, so the path is genuinely exercised.
