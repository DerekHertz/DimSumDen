```json
{"ticket": "dimsumden-ui-v0/11", "cell": "qa", "mode": "specify", "current_step": "Failing tests committed on tests/dimsumden-ui-v0-11-dashboard-charts (e5a1a69); developer next.",
 "artifacts": ["apps/ui/src/panel/dashboard-model.test.mjs"],
 "decisions": ["Seam is a pure view-model apps/ui/src/panel/dashboard-model.mjs exporting dashboardModel(metrics|null, {error}); .jsx only draws it (ADR 0011 decision 8).", "Window labels are UTC, format 'Sep 29 05:00'.", "Usage tile dropped per user decision in the designer spec: charts is exactly [throughput, tokens, incidents].", "Token valueText: >=1000 rounds to Nk, below 1000 plain integer. Incidents valueText is the perTicket number as a string."],
 "failures": [],
 "pending": [{"item": "Implement dashboard-model.mjs plus Dashboard.jsx (inline SVG, hidden table, title/desc, empty state, Metrics unavailable + Retry, refetch on metrics-changed) and mount it in Panel.jsx", "owner": "developer"}]}
```

# QA specify: 11 dashboard charts

## State
done. 10 tests, all red with ERR_MODULE_NOT_FOUND (dashboard-model.mjs does not exist).

## What changed
Branch tests/dimsumden-ui-v0-11-dashboard-charts, base 9fe628c, commit e5a1a69. One test file; interface contract is in its header comment.

## Criterion-to-test map
- Charts render from fixture metrics with correct values in labels: throughput labels/values, tokens sorted and abbreviated, incidents sorted, 12-window cap, desc names every label and value, exactly three charts (no usage tile).
- Empty metrics show an empty state, not an error: ADR empty shapes, plus null/undefined/{}/partial input, all give "No data yet", no bars, status "ok".
- Scope from designer spec: fetch error gives "Metrics unavailable" and "Retry" (tested).
- human-verified: actual SVG look, dataviz-skill colour/axis conventions, gridlines, visually hidden table, role="img", the Retry click refetching, and the metrics-changed refetch (no jsdom in the repo). Designer reviews after qa; browser smoke covers render.

## Next step
developer: make the tests pass without editing them.

## Suggested skills
tdd, dataviz, implement.

## Gotchas
Metrics shape is ADR 0011 decision 4; computeMetrics lives in scripts/metrics.mjs. Panel.jsx has an empty dashboard slot from 07.
