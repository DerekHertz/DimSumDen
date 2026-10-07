# 150 developer handoff

Fixed the Ctrl+Enter / Meta+Enter race in the test only. After the first deny POST, the test now waits for the Deny button to read "Deny" again before the Meta+Enter press. The button reads "Sending…" while `inflight` holds the kind, so that wait is the settle signal. `Cards.jsx` is untouched.

Numbers (isolation, `--test-name-pattern`):
- Before the fix: 4 failures in 12 runs (`exactly one POST /requests, got []`).
- After the fix: 0 failures in 20 runs.
- Whole `floating-cards.test.mjs`: 39 of 39 pass.
- Guard check: with `Cards.jsx` mutated so a second send is dropped, the test fails (`got []`). Mutation reverted.

```json
{
  "ticket": "organism-infra/150-floating-cards-enter-race",
  "cell": "developer",
  "current_step": "Fix committed on feat/150-floating-cards-enter-race (db3cce6); 20/20 isolated runs green; ready for review",
  "artifacts": ["apps/ui/src/overlay/floating-cards.test.mjs"],
  "decisions": ["Settle signal is the Deny button leaving its Sending state, not a fixed sleep"],
  "failures": [],
  "pending": [
    {"item": "qa verify (light) and merge on green CI", "owner": "orchestrator"}
  ]
}
```
