```json
{
  "ticket": "dimsumden-ui-v0/11-dashboard-charts",
  "cell": "qa",
  "mode": "verify",
  "current_step": "qa verify done: QA pass",
  "artifacts": ["branch feat/dimsumden-ui-v0-11-dashboard-charts @ 9ec5bec"],
  "decisions": ["QA pass"],
  "failures": [],
  "pending": [{"item": "security review, then designer review and browser smoke of Dashboard.jsx against the live bridge", "owner": "security"}]
}
```

# Handoff: dimsumden-ui-v0/11 qa verify

## Verdict
QA pass. npm test in a detached worktree at 9ec5bec: 644 pass, 0 fail, 0 skipped, 0 todo.

## Checks
- apps/ui/src/panel/dashboard-model.test.mjs is unchanged between specify (e5a1a69) and HEAD. The diff adds only new files/edits, no test removed or loosened.
- Criterion 1 (charts from fixture metrics, correct values in labels): throughput, tokens-per-ticket, incidents-per-ticket, and desc tests.
- Criterion 2 (empty metrics give an empty state, not an error): the empty-metrics test and the missing/partial test. Error/Retry path is covered by the fetch-error test.
- Scope add, GET /metrics: bridge-metrics.test.mjs (200 deep-equal to the CLI output, empty board, foreign Host 403).
- Scope add, SSE metrics-changed: pre-existing in watch.mjs, covered by bridge-events.test.mjs lines 141 and 154; no change needed.
- Human-verified: the SVG rendering in Dashboard.jsx (only the view-model is unit-tested); designer reviews.

## Non-blocking notes
- Ticket text mentions a usage tile, but specify's test asserts no usage tile (the spec decision); the developer followed it.

## Files outside scope
None. Changed: apps/bridge/server.mjs, apps/bridge/bridge-metrics.test.mjs, apps/ui/src/App.jsx, panel/Dashboard.jsx, panel/dashboard-model.mjs, styles.css.
