# 41 qa verify handoff (full): QA bounce

Branch worktree-agent-a951332b2986b5f05 at 95393cd. npm test 313/313, 0 skipped. scripts/jev-report.test.mjs unchanged since d9bee5e (diff --stat shows only scripts/jev-report.mjs added). All 5 specify tests cover their criteria.

## Bounce: value numbers include unresolved tickets
ADR 0010 decision 10 Value: "projects at least 30% fewer tokens per resolved ticket". scripts/jev-report.mjs:25-35,67-79 counts any key with cell rows; `resolved` rows only feed `bounces`. On the live usage.jsonl the tier point reports 2 tickets: 45 (resolved, 166984) and 41 (no resolved row, 132842 partial tokens). Partial tokens of an in-flight ticket skew baseline/projected (verify jev rows are written before qa verify, so every ticket's last cells are missing at report time). Also "unchanged bounces" is meaningless without a resolved row.
Required change (developer): value (baseline, projected, savedPct) and bounces sum only tickets with a `resolved` row; coverage/fallbacks/cap/ms/cost may still count every jev row. Missing test (qa to add, or developer adds a red test first): fixture with a jev'd ticket that has cell rows but no resolved row; assert its tokens are excluded from baseline/projected/savedPct while `tickets` (coverage) still counts it, and that a resolved-only fixture gives the existing numbers. Existing fixture likely needs resolved rows added; check.

## Not a bounce: zero-token ticket (organism-infra/34)
34 has cell rows with tokens:null, baseline 0. Point numbers are aggregate sums (baseline, projected) and percent is total-based, so a 0/0 ticket adds 0 to both and cannot skew the percent. It would only inflate the `tickets` coverage count if it had a jev row (it has none live). Suggest, not required: exclude tickets with baseline 0 from coverage.

Other files touched outside scope: none.

State:
```json
{"ticket":"organism-infra/41-jev-report-script","cell":"qa","mode":"verify","current_step":"QA bounce: value numbers must be resolved-tickets-only","artifacts":[],"decisions":["ADR 0010 'per resolved ticket' requires excluding unresolved tickets from value and bounces","zero-token ticket cannot skew aggregate percent"],"failures":["jev-report counts unresolved ticket 41 in tier/verify value numbers","no test for unresolved exclusion"],"pending":[{"item":"add red test for unresolved exclusion, then fix jev-report.mjs","owner":"developer"}]}
```
