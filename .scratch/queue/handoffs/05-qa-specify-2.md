# Handoff: queue/05-decay-pick-and-unplanned-cap (qa specify, round 2)

```json
{
  "ticket": "queue/05-decay-pick-and-unplanned-cap",
  "cell": "qa",
  "mode": "specify",
  "current_step": "The developer's claim holds: test 5 was wrong. Fixed the test only (commit 5ed03a2 on tests/queue-05-decay-pick-and-unplanned-cap, on top of developer a8ffdbe). queue-decay.test.mjs 21/21 pass; full npm test 4403 pass, 0 fail, 0 skipped.",
  "artifacts": [
    "branch tests/queue-05-decay-pick-and-unplanned-cap, commit 5ed03a2",
    "apps/organism-infra/queue-decay.test.mjs"
  ],
  "decisions": [
    "Test 5 pinned the pick at 2026-10-07T00:00:00Z but a resolved row sits at 2026-10-07T12:00:00Z, after the pick. ADR 0015 Amendment 3 (line 151): decay count = resolved rows after readySince or the last queue-pick, whichever is later. So that row counts and decayLeft is 4, not 5. The implementation is right; my test fixture was wrong.",
    "Fix keeps the test's intent (a picked ticket with all six resolved rows before the pick has full decay 5 and is not expired): pick ts moved to 2026-10-08T00:00:00Z, assertion still decayLeft === 5. Nothing loosened. Test 2 ('a pick resets ...') and 17 already cover rows after a pick counting.",
    "No other test or product file touched."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Light verify: npm test, diff queue-decay.test.mjs against 47c0146 (only the test-5 pick ts changed), criterion map is in the test file header. Ticket status should move from blocked to claimed-then-in-review: the orchestrator sets it back to in-review (developer work is done) before dispatching verify.",
      "owner": "orchestrator"
    }
  ]
}
```
