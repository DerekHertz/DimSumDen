```json
{"ticket":"organism-infra/49-verdict-roles-and-claim-status","cell":"qa","mode":"specify","current_step":"tests committed, red","artifacts":["scripts/verdict-roles.test.mjs @ 5c7b27c on worktree-agent-a435531f3b563b959"],"decisions":["resolved-row redo = scripts/log-resolved.mjs --ticket <ref> [--pr n]; refuses not-resolved (stderr 'not resolved') and duplicate row (stderr 'already')","release append failure: non-zero, stderr mentions usage.jsonl and log-resolved, release stays committed","log-cell caps: outcome 500, mode 32","symlinked usage.jsonl refused by board and log-cell","--pr on non-resolved release (in-review, blocked, --keep-status) refused, stderr mentions --pr, claim intact"],"failures":[],"pending":[{"item":"implement 49","owner":"developer"},{"item":"update ADR 0008","owner":"developer"}]}
```

## Summary

21 tests, 6 pass (already-true regressions), 15 red for the missing feature. Contract is pinned in the test file header. Criterion map is in the header. Human-verified: none.
