```json
{
  "ticket": "organism-infra/177-log-cell-scout-no-handoff",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Batch D specify done: failing tests committed on tests/batch-d-126-177 at 871c64c. 2 tests fail for the right reason; guards pass.",
  "artifacts": [
    "branch tests/batch-d-126-177 @ 871c64c",
    "scripts/log-cell-scout.test.mjs"
  ],
  "decisions": [
    "Seam: the log-cell CLI against a throwaway board, ORGANISM_ROOT set.",
    "Beyond the ACs I pinned that a scout row for a missing ticket is still refused (the ticket-not-found check is separate from the handoff check) and that --allow-no-handoff still records its reason on a scout row."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Skip the missing-handoff refusal for --cell scout in scripts/log-cell.mjs; make the 2 red tests green. Shares the file with 126, so do both in one branch.",
      "owner": "developer"
    }
  ]
}
```

## Summary

Criterion to test map for 177:

- C1 (scout with no handoff writes its row, exits 0): `log-cell-scout.test.mjs` "177 criterion 1: --cell scout with no handoff writes its row and exits 0" and "... with a mode and no handoff also writes its row" (both red: "no handoff for ... from scout").
- C2 (any other cell, no handoff, no --allow-no-handoff, refused): same file, one test per cell: product, architect, orchestrator, developer, qa, security, designer (guards, pass today).
- C3 (existing log-cell tests still pass): not a new test; `log-cell-handoff.test.mjs` and the other log-cell tests are untouched and verify runs them.

Extra guards: --allow-no-handoff on a developer row and on a scout row still records the reason; a scout row for a ticket not on the board is still refused.

Overlap with 126: both change scripts/log-cell.mjs. 126 changes root and ref resolution at lines 60 and 30 to 61; 177 changes the handoff check at lines 63 to 96. Note that after 126 the handoff directory comes from the resolved root, so the scout skip must stay independent of it.
