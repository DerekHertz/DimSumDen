# Handoff: queue/02-order-module-and-board-queue (developer)

```json
{
  "ticket": "queue/02-order-module-and-board-queue",
  "cell": "developer",
  "current_step": "Implementation committed at e7bc24f on tests/queue-02-order-module-and-board-queue. 12 of 13 qa tests pass; npm test is 4326 of 4327. The one failure is a wrong expectation in qa's CLI test, which I did not edit. Stopped for qa to fix that test.",
  "artifacts": [
    "apps/organism-infra/frontier-queue.mjs (buildQueue, loadSnapshot, formatQueue)",
    "apps/organism-infra/board.mjs (board queue command)"
  ],
  "decisions": [
    "Unblock count = tickets with status other than resolved or closed that name the ticket in Blocked by (jev.mjs frontierTickets counted everything not resolved)",
    "Decay applies to every ticket outside the active feature, a P0 in another feature included (ADR literal: only active-feature tickets never decay); decayLeft is null for the active feature and prints as 'never decays'",
    "Decay = 5 minus resolved rows after max(readySince, last queue-pick for the ticket); loadSnapshot takes readySince from the last events.jsonl row with to_status ready-for-agent, else the file mtime. No resolved rows means 5",
    "A Blocked by number with no ticket behind it stays as feature/NN and is never resolved, so the ticket stays blocked",
    "Result also carries expired: [] (the ADR shape); gated is [] until queue/03",
    "formatQueue prints one line per ticket: N. ref  <why> where why names tier, unblocks, P and decay; then a Planned and added per feature section; then Parked by gate last, '(none)' while empty"
  ],
  "failures": [
    "qa test 'board queue prints the order ... empty parked-by-gate list' (frontier-queue.test.mjs line 301) expects den-v1 planned 2, but the fixture's seed ticket den-v1/09-seed (resolved, no Origin line) is planned by the same rule, so den-v1 is 3 planned, 1 added. The test's own comment lists only 01-a, 02-b and 03-c. Only way to get 2 is to stop counting resolved planned tickets, which contradicts qa's handoff ('resolved tickets count') and the unit test that counts a resolved Origin-added ticket as added."
  ],
  "pending": [
    {
      "item": "Fix the CLI test expectation: either assert planned 3 (line 301) and correct the comment on line 298, or seed the fixture ticket with an Origin line / use a different feature for it. Then rerun node --test apps/organism-infra/frontier-queue.test.mjs; all 13 should pass with no implementation change.",
      "owner": "qa"
    },
    {
      "item": "Re-dispatch developer (or have qa's fix commit land and the orchestrator move to review) once the test is corrected; run /code-review and release at in-review.",
      "owner": "orchestrator"
    }
  ]
}
```

## Summary

`board queue` works against a temp board and is read only (the writes-nothing test passes). The order, tiers, active-row, P0-needs-reason, frontier and loadSnapshot tests pass. No code review was run, since the work is not final.

Sample output shape:

```
Queue (active feature: den-v1, set 2026-10-12T00:00:00Z)
1. other/01-x  p0 tier (main-red), unblocks 0, P0, decay in 5 resolved
2. den-v1/02-b  active tier, unblocks 1, P1, never decays
...
Planned and added per feature:
  den-v1: 3 planned, 1 added
Parked by gate:
  (none)
```

Not proven: performance on the real board (349 tickets plus events.jsonl); I did not run `board queue` against the main checkout.
