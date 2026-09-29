```json
{"ticket": "dimsumden-ui-v0/11", "cell": "developer", "mode": null, "current_step": "Implemented and committed on feat/dimsumden-ui-v0-11-dashboard-charts; in-review.",
 "artifacts": ["apps/ui/src/panel/dashboard-model.mjs", "apps/ui/src/panel/Dashboard.jsx", "apps/ui/src/App.jsx", "apps/ui/src/styles.css"],
 "decisions": ["Dashboard.jsx fetches /metrics and refetches on metricsRevision (metrics-changed); Retry calls the same loader.", "Throughput x-axis label is split into date and time lines from the model label.", "Usage tile omitted per designer decision."],
 "failures": [],
 "pending": [{"item": "GET /metrics is not served by apps/bridge/server.mjs yet, so the dashboard shows Metrics unavailable against the live bridge until a bridge route exists", "owner": "orchestrator"}, {"item": "Designer visual review; browser smoke", "owner": "designer"}]}
```

# Developer: 11 dashboard charts

## State
in-review. 10/10 qa tests pass; full npm test 641/641; ui:build succeeds.

## What changed
Added dashboard-model.mjs (pure view-model), Dashboard.jsx (inline SVG, title/desc, visually hidden table, empty state, error with Retry), mounted in App.jsx dashboard slot, CSS in styles.css.

## Next step
qa verify, then designer review.

## Gotchas
No /metrics bridge route exists (see pending). Rendering was not exercised in a browser.
