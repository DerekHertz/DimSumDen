```json
{
  "ticket": "organism-infra/79-route-advisory-live",
  "cell": "developer",
  "current_step": "Fix round done: the shadow route report skips advisory-mode route rows; 1249/1249 tests pass at 4be608a",
  "artifacts": [
    "scripts/jev-report.mjs",
    "scripts/jev-advisory-report.test.mjs",
    "docs/adr/0015-jev-routing-priority-scope-and-wake-gate.md"
  ],
  "decisions": [
    "Advisory rows are dropped before the latest-row-per-ticket pick, so a later advisory row cannot displace a ticket's earlier shadow route row"
  ],
  "failures": [],
  "pending": [
    { "item": "qa verify on feat/79-route-advisory-live, including the fix-round scope add", "owner": "qa" }
  ]
}
```

# 79 developer fix round 1

**State:** done. Ticket released at `in-review`.

## What changed

Branch `feat/79-route-advisory-live`, one new commit `4be608a` on top of `eaf17e9`.

- `scripts/jev-report.mjs` `routeReport`: skips rows with `mode: "advisory"` for both route halves (new-ticket and bounce). They still reach the advisory section through `jev-advisory-outcome` rows.
- `scripts/jev-advisory-report.test.mjs`: four tests added at the end under "Scope add (user, 2026-09-30)". qa's existing tests are untouched. The new tests cover:
  - new-ticket exclusion
  - bounce exclusion
  - a later advisory row not displacing the shadow row
  - `formatReport` shadow lines omitting advisory picks while the advisory section shows them
- ADR 0015 Amendment 1: the "Open" bullet now records the user's decision (see the ticket's orchestrator comment of 2026-09-30).

Tests: 1249/1249 (`npm test`). Before the fix, the four new tests failed and the other 1245 passed.

## Decisions made

See `decisions` in the State block.

## Next step

qa, `verify` mode, on `feat/79-route-advisory-live`. Map the fix-round scope add to the four new tests.

## Suggested skills

organism-protocol, code-review.

## Gotchas / for the orchestrator

- The ADR 0015 Amendment 1 "Advisory mode" bullet still says "The user still approves every dispatch". That clashes with user decision 2: bounces keep auto re-dispatch and show and log Jev's route-bounce pick without stopping. This round didn't touch that wording because it's out of scope. The architect or the user may want to reword it.
