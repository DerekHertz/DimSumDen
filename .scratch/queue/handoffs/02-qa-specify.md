# Handoff: queue/02-order-module-and-board-queue (qa specify)

```json
{
  "ticket": "queue/02-order-module-and-board-queue",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed on tests/queue-02-order-module-and-board-queue at 76e2e64: apps/organism-infra/frontier-queue.test.mjs (13 tests). Verified red for the right reason with a throwaway stub (assertion failures; board: unknown command: queue); stub removed.",
  "artifacts": [
    "branch tests/queue-02-order-module-and-board-queue (specify sha 76e2e64980e6f0b22314bf61762d027bc115bbc9)",
    "apps/organism-infra/frontier-queue.test.mjs"
  ],
  "decisions": [
    "Snapshot shape pinned in the test header: {active, tickets:[{ref,feature,num,status,priority,blockedBy:[full refs],origin,p0Reason}]}; resolved rows and picks are optional (absent = no tickets resolved)",
    "Result shape pinned: ordered items {ref,tier:'p0'|'active'|'rest',unblock,p,decayLeft,why}, plus gated:[] and unplanned:{feature:{planned,added}}",
    "A P0 without a P0-reason does not enter the p0 tier (the gate in Q2 fails it)",
    "Frontier = status ready-for-agent and every blockedBy ref resolved; loadSnapshot turns 'Blocked by' text (NN or feature/NN) into full refs, Priority default P2, Origin/P0-reason header lines, last queue_active config row wins, junk usage.jsonl lines skipped",
    "Rest-tier decayLeft is 5 when no ticket has resolved (ADR formula 5 minus the count); active-tier decayLeft is only required to be present",
    "Planned = Origin spec or no Origin; added = Origin added; resolved tickets count"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Write apps/organism-infra/frontier-queue.mjs (buildQueue, loadSnapshot) and wire `board queue` in board.mjs; read only, no events, no usage.jsonl rows. Do not edit the test file.",
      "owner": "developer"
    }
  ]
}
```

## Criterion to test map

| Criterion | Test (frontier-queue.test.mjs) |
|---|---|
| 1 order by tier, unblock, P, number, literals | "orders by tier first ..."; "P0 without a reason ..."; "within a tier: unblock count first ..."; "within a tier: equal unblock count ..."; "the rest tier orders across features ..."; "the frontier holds only ready, unblocked tickets" |
| 2 no active row: P0 tier + one rest tier | "with no active feature: the P0 tier and one tier for the rest" (null and absent); "loadSnapshot with no usage.jsonl ..." |
| 3 one reason line and decay-left per ticket | "every ordered ticket carries one reason line and a decay-left count"; CLI test checks `decay`, `P<n>`, `unblock` on each ticket line |
| 4 planned/added counts, empty parked-by-gate | "unplanned counts per feature ..." (also `gated` is []); CLI test checks the planned/added line and an empty parked-by-gate section |
| 5 one CLI test on a temp board | "board queue prints the order, a reason and decay per ticket ..." |
| 6 writes nothing | "board queue writes nothing to the board or to usage.jsonl" (full .scratch tree compared, no events.jsonl) |

loadSnapshot is covered through `buildQueue(await loadSnapshot(root))` on a plain temp directory.

## Notes for the developer

- CLI output text is pinned loosely: each ticket line contains its ref, `P<n>`, the word `unblock` and the word `decay`; a per-feature line contains the feature, `planned` and `added` with the counts within 3 non-digit chars; a section header matching `parked by gate` (any separator) with no ticket refs after it.
- Tests accept `buildQueue`/`loadSnapshot` sync or async.
- Not human-verified items: none.
