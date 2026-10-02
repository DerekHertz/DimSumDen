```json
{
  "ticket": "organism-infra/98-board-resolve-command",
  "cell": "qa",
  "mode": "verify",
  "current_step": "light verify pass: all 14 qa tests pass unmodified, full npm test 1792 pass 0 fail; security next",
  "artifacts": [
    "branch feat/98-board-resolve at 62e440a",
    "apps/organism-infra/board-resolve.test.mjs (unchanged from specify)"
  ],
  "decisions": [],
  "failures": [],
  "pending": []
}
```

## Test verification

All 14 tests from specify still pass unmodified:

1. Criterion 1 (resolve --pr N on in-review ticket, no lock):
   - "resolve --pr N on an in-review ticket with no lock resolves it with an orchestrator handoff"
   - "resolve writes the same resolved row as the claim/handoff/release path (bounces included)"
   - "resolve --note records the note text on the ticket or in the handoff"

2. Criterion 2 (locked by another cell or no --pr):
   - "resolve on a ticket locked by another cell is refused, the lock stays, nothing is written"
   - "resolve with no --pr is refused and changes nothing"
   - "resolve with --pr abc is refused and changes nothing"
   - "resolve with --pr 0 is refused and changes nothing"
   - "resolve with --pr -3 is refused and changes nothing"
   - "resolve with --pr 4.5 is refused and changes nothing"

3. Criterion 3 (batch):
   - "several refs with one --pr resolve every ticket in the batch"
   - "batch with a ticket locked by another cell (refused ref last) changes none of the tickets"
   - "batch with a ticket locked by another cell (refused ref first) changes none of the tickets"
   - "batch with a ref that does not exist changes none of the tickets"

4. Criterion 4 (docs):
   - "docs/agents/issue-tracker.md documents `board resolve`"
   - The existing claim/handoff/release path is covered by existing suites per specify notes

## Files modified (all in scope)

- apps/organism-infra/board.mjs (resolve command)
- apps/organism-infra/board-service.mjs (resolve service)
- docs/agents/issue-tracker.md (documentation)

## Notes

- Full npm test: 1792 pass, 0 fail, 0 skipped
- Test file board-resolve.test.mjs is byte-identical between specify (30640ff) and developer (62e440a)
- No assertions removed or loosened
