# 124 developer handoff

Implemented `report.route.actuals` in `scripts/jev-report.mjs` (commit 5054e53 on `feat/124-jev-route-actual-logging`). All 14 tests in `scripts/jev-route-actual.test.mjs` pass. The writer is unchanged, as qa decided.

```json
{
  "ticket": "organism-infra/124-jev-route-actual-logging",
  "cell": "developer",
  "current_step": "route.actuals and formatReport 'route actual' lines implemented and committed (5054e53); qa tests green; ready for qa verify.",
  "artifacts": ["scripts/jev-report.mjs"],
  "decisions": [
    "boardEvents now carries mode; new routeActuals() scores every route row against the first claim (any cell) on the same feature/NN with ts strictly after the row ts; claimRole maps qa+specify/verify to qa-specify/qa-verify.",
    "formatReport prints one 'route actual' line per route row after the bounce route section. Existing agreement labels untouched."
  ],
  "failures": [
    "npm test: 2031 tests, 2030 pass, 1 fail: apps/ui/src/overlay/floating-cards.test.mjs 'Ctrl+Enter in the Note sends Deny with that note; Cmd+Enter does too...' (expectPost actual 0 expected 1). Fails alone too. This ticket touches only scripts/jev-report.mjs, which that test does not import; not run against the base, so pre-existing is a belief, not verified."
  ],
  "pending": [
    {"item": "qa verify; confirm the floating-cards failure also occurs on main", "owner": "qa"}
  ]
}
```
