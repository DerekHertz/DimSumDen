```json
{"ticket": "dimsumden-ui-v0/11", "cell": "developer", "mode": null, "current_step": "Scope add done: GET /metrics served by the bridge; committed 9ec5bec on feat/dimsumden-ui-v0-11-dashboard-charts.",
 "artifacts": ["apps/bridge/server.mjs", "apps/bridge/bridge-metrics.test.mjs"],
 "decisions": ["The SSE metrics-changed event already existed in apps/bridge/watch.mjs with tests in bridge-events.test.mjs (usage.jsonl and events.jsonl); no change needed.", "GET /metrics reads both logs per request with parseJsonl from scripts/metrics.mjs, so it matches metrics.mjs --json."],
 "failures": [],
 "pending": [{"item": "qa verify of the /metrics route, then designer review and browser smoke of the dashboard against the live bridge", "owner": "qa"}]}
```

# Developer fix: 11 GET /metrics

## State
done. Full npm test 644/644.

## What changed
Branch feat/dimsumden-ui-v0-11-dashboard-charts, commit 9ec5bec. server.mjs adds the GET /metrics route (200, no-store, computeMetrics output). New bridge-metrics.test.mjs: body deep-equals the separate-process CLI output for the same root, empty board gives 200 with usage null, foreign Host is 403.

## Next step
qa verify, then designer review.

## Gotchas
The latest usage row by ts in the fixture has no numeric five_hour, so usage.fiveHour is undefined there; the test asserts sampledAt instead.
