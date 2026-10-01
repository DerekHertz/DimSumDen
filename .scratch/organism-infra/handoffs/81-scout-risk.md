```json
{"ticket":"organism-infra/81-provider-neutral-usage-watch","cell":"scout","current_step":"Risk stage attempted; risk-check failed before classification.","artifacts":["/tmp/81-risk.txt"],"decisions":[],"failures":["npm run risk-check -- origin/main...HEAD exited 1: spawnSync git EPERM in scripts/risk-check.mjs:35; actual security hit status is unknown."],"pending":[{"item":"Resolve risk-check environment failure and determine whether security review is required.","owner":"orchestrator"}]}
```

## State
Partial: merge-tree completed; risk-check could not classify the diff.

## What changed
No product changes. Detached scout worktree at 4fcf134c7add047522803069e61f6bbec223e4bd.

## Decisions made
None.

## Next step
Orchestrator should resolve the risk-check invocation failure and determine whether to dispatch security.

## Suggested skills
organism-protocol, handoff.

## Gotchas
`git merge-tree --write-tree origin/main HEAD` succeeded and returned tree 3741ef140c572e80f81c97c0be27da5cde6459f8. The npm risk-check printed an EPERM from its child-process git diff invocation; do not treat the resulting status as clean.