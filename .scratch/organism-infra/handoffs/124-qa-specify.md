# 124 qa specify handoff

Tests are written and committed on `tests/124-jev-route-actual-logging` (tests commit 5f708c2). All 13 fail because `report.route.actuals` does not exist yet. The CLI test fails because the `route actual` lines are missing.

```json
{
  "ticket": "organism-infra/124-jev-route-actual-logging",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed (5f708c2) in scripts/jev-route-actual.test.mjs; 13 tests red for the missing route.actuals derived view.",
  "artifacts": ["scripts/jev-route-actual.test.mjs"],
  "decisions": [
    "The writer is NOT changed. A route row is written before the dispatch it predicts, so jev.mjs cannot know the real next role. Row.actual keeps its meaning of what Jev applied (orchestrator when nothing applied), and jev-route.test.mjs, jev-route-bounce.test.mjs and jev-advisory.test.mjs pin that. The fix is a derived view in jev-report.mjs, which the ticket allows (a row or a report line).",
    "New seam: buildReport(rows, events).route.actuals, one entry per route row (either variant, any mode, fallback rows included), in row order: {ticket, ts, variant, pick, logged, actual}.",
    "actual is the cell of the first op:claim event on the same feature and NN with ts strictly after the row ts, any cell (orchestrator counts). qa+mode specify gives qa-specify, qa+verify gives qa-verify, qa with no mode gives qa, other cells keep their name. null when no later claim.",
    "formatReport prints 'route actual <ticket>: pick <pick|none>, actual <role|none yet>' per route row.",
    "The existing agreement labels (developer maps to developer-direct) are untouched; actuals uses raw roles."
  ],
  "failures": [],
  "pending": [
    {"item": "Implement route.actuals and the formatReport lines in scripts/jev-report.mjs so scripts/jev-route-actual.test.mjs passes; keep existing tests green; do not edit usage.jsonl or loosen existing row.actual tests", "owner": "developer"}
  ]
}
```

## Criterion to test map

All tests are in `scripts/jev-route-actual.test.mjs`.

- Criterion 1 (developer claim gives developer; qa specify gives qa-specify):
  - "a developer claim after the route call gives actual developer..."
  - "qa claimed with mode specify gives qa-specify..."
  - "other cells report their own name"
  - "the next claim wins..."
- Criterion 2 (existing rows report the real role, usage.jsonl not edited):
  - "CLI: existing usage.jsonl rows report their real next role... file untouched"
  - "buildReport does not mutate the usage rows"
  - "formatReport prints one 'route actual' line per route row"
- Criterion 3 (no orchestrator unless it really claimed):
  - "no routed ticket with a later non-orchestrator claim reports orchestrator"
  - "a route row with no later claim reports actual null, not orchestrator"
  - "an orchestrator claim after the route call reports orchestrator"
- Edge cases:
  - other feature with the same number
  - both variants, every mode, and fallback rows
  - two rows on one ticket
  - no events
- Criterion 4 (`npm test` green): it is the developer's gate. This handoff did not run the full suite.
- human-verified: none.
