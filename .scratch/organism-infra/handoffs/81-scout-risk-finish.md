```json
{"ticket":"organism-infra/81-provider-neutral-usage-watch","cell":"scout","current_step":"Risk-check completed and requires full security review.","artifacts":["/tmp/81-risk-finish.txt"],"decisions":["Risk-check reported four hits; security review is required."],"failures":["Initial default-permission risk-check attempt failed with spawnSync git EPERM; retry with the supported per-command permission flow succeeded."],"pending":[{"item":"Run full security review of the reported risk hits.","owner":"security"}]}
```

## State
Done: risk scan completed; full security review required.

## What changed
No product changes. Diff scanned: origin/main...HEAD.

## Decisions made
The four risk-check hits require full security review.

## Next step
Security should review the hits below.

## Suggested skills
organism-protocol, handoff.

## Gotchas
Risk-check output: `scripts/usage-codex.mjs: shelling out to another program`; `scripts/usage-provider.test.mjs: possible secret: hardcoded API key/token/secret`; `scripts/usage-provider.test.mjs: shelling out to another program`; `scripts/usage-provider.test.mjs: secrets handling`. Initial invocation failed with EPERM; supported per-command permission flow allowed it to complete.