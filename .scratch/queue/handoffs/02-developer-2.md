# Handoff: queue/02-order-module-and-board-queue (developer, hop 2)

```json
{
  "ticket": "queue/02-order-module-and-board-queue",
  "cell": "developer",
  "current_step": "Done. qa's corrected test (e8aa3dd) passes against the unchanged implementation (e7bc24f). 13 of 13 in frontier-queue.test.mjs and npm test 4327 of 4327. Code review run; no changes needed. Releasing at in-review.",
  "artifacts": [
    "branch tests/queue-02-order-module-and-board-queue (head e8aa3dd; no new commit this hop)",
    "apps/organism-infra/frontier-queue.mjs",
    "apps/organism-infra/board.mjs"
  ],
  "decisions": [
    "No implementation change this hop: the only failure was qa's wrong planned count, which qa fixed.",
    "Code review findings left alone as out of scope: ref strings built by hand in several places (a shared helper could live in board-refs), status strings repeated, terse names (p, unblock, unplanned), gated and expired always [] by design until queue/03 and queue/05.",
    "Checked and not a bug: parsePriority always returns P0 to P3 (default P2), so no NaN in the sort. A ticket blocked by a closed ticket stays blocked because ready means every Blocked by is resolved (organism-protocol); unblock count skips closed, which is intended."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Light verify by qa (specify sha 76e2e64; only test diff since is the planned 2 to 3 correction at e8aa3dd, qa-authored), then risk-check, PR and merge.",
      "owner": "orchestrator"
    }
  ]
}
```

## Summary

Verified: `node --test apps/organism-infra/frontier-queue.test.mjs` 13 pass, 0 fail; `npm test` 4327 pass, 0 fail (scout run); `node --check` clean on both changed files.

Follow-up candidates for the orchestrator (not done here): a shared ref-builder helper; `readJsonLines` swallows all read errors including EACCES; `parseBlockedBy` bare-number regex could match digits in prose.

Not proven: `board queue` against the real main-checkout board (349 tickets plus events.jsonl) was not run.
