```json
{
  "ticket": "organism-infra/98-board-resolve-command",
  "cell": "qa",
  "mode": "specify",
  "current_step": "specify done: 14 failing tests committed on tests/98-board-resolve at 30640ffd24c3700923c875b38b73db108f009d64; developer next",
  "artifacts": [
    "branch tests/98-board-resolve",
    "commit 30640ffd24c3700923c875b38b73db108f009d64",
    "apps/organism-infra/board-resolve.test.mjs"
  ],
  "decisions": [
    "resolve --pr is required for every ticket (code or not); a missing or invalid value is refused with 'pr' on stderr",
    "resolve publishes an orchestrator handoff named <NN>-*.md: State block ticket <feature>/<NN-slug>, cell orchestrator, current_step 'resolved', PR number inside artifacts",
    "--note text may land in the ticket comments or in the handoff (test accepts either)",
    "a refusal on any ref in a batch leaves events.jsonl, usage.jsonl, tickets, locks and handoffs byte-identical (all validation before any write)",
    "a ref that does not exist counts as a refusal (batch changes nothing)"
  ],
  "failures": [],
  "pending": [
    { "item": "Implement board resolve in apps/organism-infra/board.mjs and board-service.mjs (validate every ref first, then claim, handoff, release per ref) and document it in docs/agents/issue-tracker.md", "owner": "developer" }
  ]
}
```

## Criterion-to-test map (apps/organism-infra/board-resolve.test.mjs)

1. `resolve --pr N` on in-review ticket, no lock, resolved + orchestrator handoff + resolved row as release writes it:
   - "resolve --pr N on an in-review ticket with no lock resolves it with an orchestrator handoff"
   - "resolve writes the same resolved row as the claim/handoff/release path (bounces included)" (compares against the legacy path, bounces seeded as events)
   - "resolve --note records the note text on the ticket or in the handoff"
2. Locked by another cell, or no `--pr`: non-zero, nothing changed:
   - "resolve on a ticket locked by another cell is refused, the lock stays, nothing is written"
   - five tests "resolve with <no --pr | --pr abc | 0 | -3 | 4.5> is refused and changes nothing"
3. Batch:
   - "several refs with one --pr resolve every ticket in the batch"
   - "batch with a ticket locked by another cell (refused ref last | refused ref first) changes none of the tickets"
   - "batch with a ref that does not exist changes none of the tickets"
4. Docs: "docs/agents/issue-tracker.md documents `board resolve`" (the line names `--pr`). "The existing claim/handoff/release path still works" is covered by the existing suites (scripts/usage-rows.test.mjs, board-release-*.test.mjs) and by the legacy-path half of the same-row test; no new test.

No criteria are human-verified.

## Notes for the developer

- All 14 tests fail today because `board: unknown command: resolve`. Refusal tests also assert stderr does not say "unknown command", so they cannot pass vacuously.
- Refusals must be checked for every ref before the first claim, so a later bad ref leaves no earlier claim, handoff, or row. The ticket comment asks that resolve never end silently partial.
- Bounce comments in the same-row test are seeded straight into events.jsonl, because `board comment --verdict` needs a held claim.
