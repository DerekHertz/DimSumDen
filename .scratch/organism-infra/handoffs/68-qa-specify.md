```json
{"ticket": "organism-infra/68", "cell": "qa", "mode": "specify",
 "current_step": "Criterion 2 failing tests committed on tests/batch-B @ 77ea34b",
 "artifacts": ["scripts/jev-report-exit-criteria.test.mjs"],
 "decisions": [
   "Criterion 1 (orchestrator verdicts) and criterion 3 (verdict recorded on board) are orchestrator work post-merge; only criterion 2 is in batch B.",
   "Value bar: savedPct >= 30 (ADR 0010 decision 10).",
   "safetyBounces: resolved tickets with bounces > 0 AND a non-fallback, non-null jev pick for that point."
 ],
 "failures": [],
 "pending": [{"item": "implement buildReport checks+safetyBounces and formatReport PASS/FAIL so tests 1-11 in jev-report-exit-criteria.test.mjs pass", "owner": "developer"}]}
```

**State:** done — 11 failing tests for criterion 2 committed on `tests/batch-B` @ `77ea34b`.

**What changed:** `scripts/jev-report-exit-criteria.test.mjs` (11 tests).

This is batched with organism-infra/47; both tickets share one relay, one branch, one PR (batch B).

**Criterion → test map**

| Criterion | Tests | Notes |
|-----------|-------|-------|
| 68/2: jev-report output supports verdict without hand computation | jev-report-exit-criteria.test.mjs tests 1–11 | Covers checks shape, value/coverage/spend logic, safetyBounces, and formatReport PASS/FAIL output |

See handoff `47-qa-specify.md` for the full map (68/2 rows at the bottom of the table).

**Next step:** Developer implements the fixes (shares branch with 47).

**Suggested skills:** `implement`, `organism-protocol`

**Gotchas:** `buildReport` already exports `buildReport` and `formatReport`; changes are additive. The `POINTS = ["tier", "verify"]` constant is already correct. The `safetyBounces` list is the key enabler: without it the orchestrator must check all handoffs; with it they check only the named tickets.
