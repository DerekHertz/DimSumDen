# 41 developer fix1 handoff

Fixed the qa bounce in scripts/jev-report.mjs on top of qa/41-unresolved-exclusion (3a9c393). Value (baseline, projected, savedPct) and bounces now sum only tickets with a resolved row; coverage, medianMs and jevCost count jev rows of any ticket whose cell tokens total more than 0. Tests 7/7 in jev-report.test.mjs, full suite 315/315.

Live usage.jsonl: tier 2 tickets, savings -30.0% (projected 217121 vs baseline 166984); verify 2 tickets, 0.0%.

State:
```json
{"ticket":"organism-infra/41-jev-report-script","cell":"developer","mode":"fix","current_step":"fix committed, tests green","artifacts":["scripts/jev-report.mjs"],"decisions":["per-ticket list still shows all tickets, with a resolved flag","baseline-0 tickets excluded from coverage, ms and cost"],"failures":[],"pending":[{"item":"qa verify, security, merge","owner":"orchestrator"}]}
```
