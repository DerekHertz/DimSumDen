# Handoff: queue/05-decay-pick-and-unplanned-cap (developer)

```json
{
  "ticket": "queue/05-decay-pick-and-unplanned-cap",
  "cell": "developer",
  "current_step": "Implementation committed at a8ffdbe on tests/queue-05-decay-pick-and-unplanned-cap. 20 of 21 tests in queue-decay.test.mjs pass; full npm test: 4402 pass, 1 fail. The 1 fail (test 5, 'buildQueue expired lists a ticket outside the active feature...') is a wrong assertion in the test, not a missing feature. Stopped there per the rule: I did not edit the test.",
  "artifacts": [
    "branch tests/queue-05-decay-pick-and-unplanned-cap, commit a8ffdbe (on top of qa's 47c0146)",
    "apps/organism-infra/frontier-queue.mjs",
    "apps/organism-infra/board.mjs"
  ],
  "decisions": [
    "Cap boundary: an Origin-added ticket is refused when the added tickets already filed in its feature (every status, the ticket itself left out, security findings included) satisfy added * 3 > planned, and the feature has >= 3 planned. So exactly a third is still admitted. Planned = every ticket not Origin: added. Finding exemption: Serves matches finding:<ref>.",
    "Cap reason text: 'unplanned: N added tickets already filed in <feature> against M planned, past a third; admitting another needs the user's yes (queue-admin admit)'.",
    "Expired tickets stay in buildQueue().ordered (with decayLeft 0) until gate --apply parks them. expired = refs of ordered items with decayLeft 0.",
    "gateRefusals now also lists decayed tickets with reason 'decay: 5 tickets resolved since it was ready or last picked, and it was not picked' (merged with any admission reasons). An admitted ticket skips the admission check but still decays. The park goes through gateReason, so it carries the 'admission gate: ' prefix and shows in the Queue's 'Parked by gate' list.",
    "loadSnapshot treats an event with to === 'ready-for-agent' (unpark, reopen) like to_status, so an unpark restarts decay.",
    "board pick <ref> [--deviation <why>]: refuses an unknown ticket via getStatus ('ticket not found: <ref>', nothing written); row {kind:'queue-pick', ts, top, picked, deviation?} where top is ordered[0].ref or null. It does not require the ticket to be ready."
  ],
  "failures": [
    "queue-decay.test.mjs test 5 line 138 asserts item(q, picked.ref).decayLeft === 5, but the code (and any reading of the rule) gives 4. The pick is at 2026-10-07T00:00:00Z and a resolved row sits at 2026-10-07T12:00:00Z, which is after the pick, so one resolved row counts. The same test's fresh-ticket arithmetic (ready day 6 00:00, rows at day 6 and 7 12:00 both count) confirms rows later the same day count. The assertion that matters (expired is exactly [stale]) passes. Fix is qa's: change the pick ts to 2026-10-08T00:00:00Z, or expect 4."
  ],
  "pending": [
    {
      "item": "Fix queue-decay.test.mjs test 5 (pick ts to 2026-10-08T00:00:00Z, or expect decayLeft 4), then re-run npm test; the implementation needs no change.",
      "owner": "qa"
    },
    {
      "item": "Light verify after the test fix: npm test, diff the test file against 47c0146, check the criterion map.",
      "owner": "qa"
    }
  ]
}
```
