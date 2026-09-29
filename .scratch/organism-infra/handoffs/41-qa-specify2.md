# 41 qa specify2 handoff (fix round)

Branch qa/41-unresolved-exclusion, commit 3a9c393, from 95393cd (developer's implementation). Test file: scripts/jev-report.test.mjs (2 tests added, existing 5 untouched; fixture already had resolved rows for f/01-f/03, so no fixture or expected-number change).

Red state: 5 pass, 2 fail, both for the missing behavior.
- "unresolved ticket counts in coverage but not in baseline, projected, savedPct or bounces": tier baseline 6200 != 2200 (f/04, no resolved row, is counted).
- "a baseline-0 ticket ... not counted in coverage": tickets 2 != 1.

## Contract pinned
- Value (baseline, projected, savedPct) and bounces sum only tickets with a `resolved` row.
- Coverage (`tickets`), medianMs, jevCost still count every included jev row of an unresolved ticket. Whether unresolved tickets appear in report.tickets is not asserted.
- A ticket whose cell rows total 0 tokens (null tokens) is not counted in `tickets` coverage, nor its ms/cost.

## Criterion to test map
- Unresolved exclusion (coordinator, ADR 0010 "per resolved ticket"): first new test.
- Baseline-0 not in coverage: second new test.

State:
```json
{"ticket":"organism-infra/41-jev-report-script","cell":"qa","mode":"specify","current_step":"fix-round tests committed, 2 red","artifacts":["scripts/jev-report.test.mjs"],"decisions":["value and bounces resolved-only; coverage/ms/cost count unresolved jev rows","baseline-0 tickets excluded from coverage incl. ms","no fixture change needed"],"failures":[],"pending":[{"item":"make the 2 new tests pass in scripts/jev-report.mjs on top of qa/41-unresolved-exclusion","owner":"developer"},{"item":"qa verify, security, merge","owner":"orchestrator"}]}
```
