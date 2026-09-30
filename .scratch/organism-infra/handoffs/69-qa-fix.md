# qa specify fix round, organism-infra/69

```json
{
  "ticket": "organism-infra/69-jev-route-new-ticket-shadow-and-reserved-budget",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Fixed the one wrong test on branch qa/69-jev-route-tests-fix at 8417edb. Ready for the developer to re-run.",
  "artifacts": ["scripts/jev-route-report.test.mjs"],
  "decisions": ["Changed data to 15 product + 3 architect picks dispatched to product = 83.3%, kept agreement FAIL and per-label lines"],
  "failures": [],
  "pending": [{"item": "Re-verify against branch dev/69-jev-route-shadow 026e683", "owner": "developer"}]
}
```

Branch: qa/69-jev-route-tests-fix (from f6321cc; original branch is held by another worktree).
Only change: scripts/jev-route-report.test.mjs, test "formatReport prints per-label agreement and one PASS/FAIL line per go-live check". Label assertion now `route agreement architect: 0/3`. No other test touched, no assertion weakened.

Proof: with dev's scripts/jev.mjs and jev-report.mjs (026e683) checked out, the five jev test files (floor, report, route-report, route, jev) pass 70/70. With main's jev-report.mjs, all 15 route-report tests fail, including the fixed one.
