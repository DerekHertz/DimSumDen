```json
{
  "ticket": "den-v1/06-approve-deny",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify of developer round 3 (?demo=approval) on feat/06-approve-deny at 3e16e6f: QA bounce. The saved suite output has one failure, which bounces the ticket by the light-verify rules.",
  "artifacts": [
    "apps/ui/src/overlay/proximity-card.browser.test.mjs",
    "apps/ui/src/state/bridge-client.test.mjs",
    "apps/ui/src/overlay/approval-review.test.mjs",
    "apps/ui/src/overlay/approval-wiring.test.mjs"
  ],
  "decisions": [
    "Did not re-run npm test, per the orchestrator's instruction. Used /tmp/06-tests.txt as the suite result: 2888 tests, 2887 pass, 1 fail, 0 skipped.",
    "The one failure is apps/ui/src/overlay/proximity-card.browser.test.mjs test 662 'entering the den shows the nearby resident card; moving away and leaving hides it' (test file line 55): waitFor hidden timed out after 10s, and the 'Nearby panda' region stayed visible. The saved output is an assertion timeout, not a hang.",
    "Discrepancy: 06-developer-3 says the one failure was mods-sleep-guard.test.mjs. The saved output has no mods-sleep-guard entry. The failing test is in proximity-card.browser.test.mjs. The saved output's location paths point at worktree agent-af465987b670bca27, and I did not confirm it ran at 3e16e6f.",
    "Whether this failure is caused by this ticket or is the pre-existing browser-test problem (organism-infra/206) is not judged here. This ticket changes ProximityCard.jsx, proximity-card.mjs and App.jsx, which the failing test covers.",
    "Specify test diff (23f45be..HEAD): approval-review.test.mjs and approval-wiring.test.mjs are unchanged. bridge-client.test.mjs:19 changes only how TOKEN is built (same value 'tok-test-123', built with join for the secret scan). No assertion changed."
  ],
  "failures": [
    {
      "item": "proximity-card.browser.test.mjs:55 (test 'entering the den shows the nearby resident card; moving away and leaving hides it')",
      "why": "Suite run fails this test: 'Nearby panda' region still visible after 10s. Not in the criterion map; it breaks npm test green (criterion 5)."
    },
    {
      "item": "06-developer-3 names mods-sleep-guard.test.mjs as the failure; the saved output shows proximity-card.browser.test.mjs instead",
      "why": "Handoff and suite output disagree on which test fails. Developer should confirm which run is correct."
    }
  ],
  "pending": [
    {
      "item": "Developer: make proximity-card.browser.test.mjs test 662 pass with the approval changes (or show it is a pre-existing failure), and re-run npm test. Then qa light verify again.",
      "owner": "developer"
    },
    {
      "item": "Orchestrator: decide whether the failing test is caused by this ticket or is the known browser-test issue (organism-infra/206).",
      "owner": "orchestrator"
    }
  ]
}
```

# 06 qa verify round 2 (light): QA bounce

Verdict: QA bounce, on the suite result alone.

## Criterion to test map

| Criterion | Test | Result |
|---|---|---|
| 1. A then confirm sends one allow with token; D sends deny | bridge-client.test.mjs (POST route, Bearer via real session, body); approval-review.test.mjs 'Allow sends exactly one decide to the approval's id with the bare decision' and 'A and D open the review; nothing is sent' (ok 603) | pass |
| 2. Tool input shown before any decision | approval-review.test.mjs 'the tool input is shown before any decision' (ok 604) | pass |
| 3. Refused request shows bridge's reason, changes nothing | approval-review.test.mjs 'a refusal shows the bridge's reason and changes nothing' (ok 608); bridge-client.test.mjs 'failures reject with { status, reason }' (ok 1133) | pass |
| 4. Stub bridge and fixtures, no live runtime | approval-wiring.test.mjs (poisons global fetch); approval-fixture.test.mjs | covered; not failing in the suite |
| 5. npm test green | saved suite output | FAIL: 1 failure (proximity-card.browser.test.mjs:55) |

Human-verified (from the specify handoff, unchanged): panel layout and width, phone bottom sheet, header and footer styling, lantern and spinner, motion, reduced motion, contrast, focus rings, live region, transcript closing, pointer-lock release. The user does these in `npm run ui` at /?demo=approval.

## Files touched outside specify scope (listed, not judged)

- apps/ui/src/scene/procedural/explorer.mjs (2 lines)
- apps/ui/src/overlay/TranscriptPanel.jsx (5 lines)
- apps/ui/src/scene/procedural/den.css (49 lines added)
- apps/ui/src/scene/approval-fixture.mjs and approval-fixture.test.mjs (new; dev-only ?demo=approval, per the user decision in the ticket comments)
- Also in scope but changed since specify: App.jsx, ProximityCard.jsx, proximity-card.mjs, ApprovalPanel.jsx, approval-review.mjs, bridge-client.mjs

## Next

Developer fixes the failing test or shows it is pre-existing, then re-runs npm test. A fresh light verify follows.
