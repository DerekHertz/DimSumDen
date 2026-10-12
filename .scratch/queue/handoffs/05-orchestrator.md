# Handoff: queue/05-decay-pick-and-unplanned-cap (orchestrator)

```json
{
  "ticket": "queue/05-decay-pick-and-unplanned-cap",
  "cell": "orchestrator",
  "current_step": "Status moved from blocked to in-review. The developer released blocked at a8ffdbe because specify test 5 asserted a wrong decayLeft; qa specify (second hop) confirmed and fixed the test only, commit 5ed03a2. Full suite 4403 pass, 0 fail on 5ed03a2.",
  "artifacts": [
    "branch tests/queue-05-decay-pick-and-unplanned-cap, tip 5ed03a2"
  ],
  "decisions": [
    "Not counted as a bounce: no reviewer failed the ticket."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Light verify on 5ed03a2, then risk-check, PR and merge.",
      "owner": "qa"
    }
  ]
}
```
