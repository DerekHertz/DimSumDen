# 218 security review

Verdict: Security pass. Reviewed 289473704..0c613d7 (scripts/log-cell.mjs, scripts/log-cell-ticketless.test.mjs). No package.json or lockfile change, so no dependency review. gitleaks: 3 commits, no leaks.

```json
{
  "ticket": "organism-infra/218-log-cell-ticketless",
  "cell": "security",
  "current_step": "Security review done: pass, no critical or high findings; two low notes.",
  "artifacts": ["scripts/log-cell.mjs", "scripts/log-cell-ticketless.test.mjs"],
  "decisions": [
    "ticketless is the exact string none; no path is built from it (m stays null and is only read on the non-ticketless path), so no traversal surface added",
    "non-scout ticketless rows need --allow-no-handoff with a reason, so the organism-infra/51 guard is kept"
  ],
  "failures": [],
  "pending": [
    {
      "item": "orchestrator: open PR and merge on green CI",
      "owner": "orchestrator"
    }
  ]
}
```

## Findings

- scripts/log-cell.mjs:136 low: the row is written with ticket null and spend/incident rows reuse row.ticket, so nothing user-controlled reaches a path or shell. No action.
- scripts/log-cell.mjs:90 low: --allow-no-handoff remains a self-asserted escape for any cell (length-capped at 300, logged in the row). Existing design, user-decided on 2026-10-08. No action.
- Note for the orchestrator (not security): scripts/spend.mjs:27 buckets ticketless spend rows under "(none)" in by_ticket. AC3 says they stay out of per-ticket totals; test 8 passes, so qa judged it met. Not changed in this branch.
