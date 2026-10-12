# Handoff: queue/02-order-module-and-board-queue (qa specify, fix round)

```json
{
  "ticket": "queue/02-order-module-and-board-queue",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Developer's dispute upheld: the CLI test expectation was wrong. Fixed in frontier-queue.test.mjs and committed at e8aa3dd on tests/queue-02-order-module-and-board-queue. All 13 tests in the file pass against the developer's implementation (e7bc24f), no implementation change.",
  "artifacts": [
    "branch tests/queue-02-order-module-and-board-queue (fix sha e8aa3dd; original specify sha 76e2e64)",
    "apps/organism-infra/frontier-queue.test.mjs"
  ],
  "decisions": [
    "Test was wrong, not the implementation. The fixture seed den-v1/09-seed is resolved with no Origin line. My own specify rule is planned = Origin spec or no Origin, and resolved tickets count. So den-v1 has 01-a (spec), 02-b (none), 09-seed (none) = 3 planned and 03-c (added) = 1 added. I had miscounted the fixture and listed only three tickets in the comment.",
    "Kept the rule 'resolved tickets count' rather than editing the fixture or dropping resolved planned tickets: it matches the unit test that counts a resolved Origin-added ticket as added.",
    "Changed only the planned assertion (2 to 3) and the comment on it; no assertion was loosened. The added=1 assertion is unchanged."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Developer or orchestrator: run /code-review and release the ticket at in-review. Light verify can follow (specify sha 76e2e64; the only test diff since is the planned 2 to 3 correction at e8aa3dd, which the verifier should accept as qa-authored).",
      "owner": "orchestrator"
    }
  ]
}
```

## Notes

- Verified: `node --test apps/organism-infra/frontier-queue.test.mjs` gives 13 pass, 0 fail, 0 skipped.
- Full `npm test` not rerun in this round; the developer reported 4326 of 4327 with this one failure, so the suite should now be fully green.
- Not human-verified items: none.
