# 218 qa specify handoff

Branch: `tests/218-log-cell-ticketless` (commit 66f9e74, base 2894737). Test file: `scripts/log-cell-ticketless.test.mjs` (8 tests, `node --test`, existing fixtures only).

```json
{
  "ticket": "organism-infra/218-log-cell-ticketless",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Tests written and committed on tests/218-log-cell-ticketless; 6 of 8 fail for the right reason (log-cell refuses --ticket none), 2 are regression guards that already pass.",
  "artifacts": ["scripts/log-cell-ticketless.test.mjs"],
  "decisions": [
    "Criterion 3 does not assert the absence of a '(none)' key in spend's by_ticket: spend-report.test.mjs already pins by_ticket['(none)'] for ticketless spend rows. The test asserts no real ticket entry changes or appears and that the role total includes the run.",
    "Scout is used for ticketless runs so the handoff check does not apply; whether a non-scout ticketless row needs --allow-no-handoff is left to the developer.",
    "No criterion is human-verified."
  ],
  "failures": [],
  "pending": [
    {"item": "Make log-cell accept the exact string 'none' as --ticket (row ticket: null, skip the ticket-exists and handoff-lookup steps for it, spend row without ticket). scripts/spend.mjs likely needs no change. Do not edit the specify tests.", "owner": "developer"}
  ]
}
```

## Criterion to test map

- AC1 (`--ticket none` writes one row, `ticket: null`, same fields): tests 1 (fields, values), 2 (same key set as a ticketed row), 3 (other checks kept: bad --tokens refused), 4 (--transcript totals on the cell row and a spend row with no ticket), 5 (unreadable --transcript still refused).
- AC2 (unknown ref other than none refused): test 6 (`nosuch/99-ghost`, `None`, `NONE`, `null`, `-`, `none/01-x`, `none `), test 7 (omitted or empty --ticket). Both already pass today; they guard against over-loosening.
- AC3 (spend: role totals include, ticket totals exclude): test 8, end to end through log-cell then `spend.mjs --json`.
- AC4 (`npm test` green): the developer's run; not a test.

## Notes for the developer

- Ticket text says ticketless rows are left out of per-ticket totals. `spend.mjs` already files ticket-less spend rows under `by_ticket["(none)"]` and a separate spec test pins that, so I read "per-ticket totals" as real tickets. If the orchestrator wants the `(none)` bucket gone, that conflicts with spend-report.test.mjs and needs a ticket decision.
- Failing run (before the change): 6 fail, 2 pass; each failure is the `--ticket must be <feature>/<NN-slug>` refusal.
