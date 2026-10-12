```json
{
  "ticket": "organism-infra/228-ui-run-any-frontier-ticket",
  "cell": "developer",
  "current_step": "Built to qa's 42 tests and the signed-off UI spec; committed b0f959c on feature/organism-infra-228-ui-run-any-frontier-ticket. Full npm test 4487 pass, 0 fail; npm run smoke:ui all PASS. Awaiting qa verify and the user's visual verdict.",
  "artifacts": [
    "branch feature/organism-infra-228-ui-run-any-frontier-ticket @ b0f959c",
    "apps/ui/src/overlay/run-model.mjs (new)",
    "apps/ui/src/overlay/Cards.jsx (useRunner, RunControl, SlotStrip, StationsCard, NeedsYouCard, Cards)",
    "apps/ui/src/state/bridge-client.mjs (dispatch)",
    "apps/ui/src/overlay/overlay-model.mjs (next lists every row, rows carry type)",
    "apps/ui/src/styles.css (slot strip, run control; tokens only)",
    "apps/ui/src/App.jsx (passes demo to Cards)",
    "apps/ui/src/overlay/floating-cards.test.mjs (fixture only: added a capacity key)"
  ],
  "decisions": [
    "Reason order in runState: demo, not signed in, capacity unknown, in flight, already running, no room. No test forced a different order.",
    "In flight: button reads Starting... and no reason line is shown (the reason string is 'Starting…' but hidden while inflight). Already live: 'Already running'.",
    "defaultRole: design tickets map to orchestrator (unrecognised), per the brief.",
    "Session cap binding lists live refs only ('<live> of <cap> running: <live refs>').",
    "dispatchPrompt with unknown capacity returns show:true (older bridge keeps today's prompt); untested, unspecified.",
    "In-flight and refusal state live in one useRunner hook at Cards level, so the Stations row and the Needs you dispatch card for the same ref agree.",
    "A refusal clears on the next press or when the row's settled runState (enabled, reason) changes.",
    "The 201 usage note ('Started. Usage reading unavailable.') shows under the row; because the row leaves the list on the next snapshot, the note is also shown under the slot strip prefixed with the ref, until the next Run press.",
    "Keys a, d, m return early in NeedsYouCard while the dispatch prompt is absent (no preventDefault either).",
    "Needs you card now has flex-shrink 0 and max-height 55vh so the taller Stations card cannot squeeze the dispatch card (seen clipped at 900px in a screenshot). Slot strip is position sticky inside the Stations body.",
    "Existing floating-cards.test.mjs tab-order test failed because the fixture had no capacity (Run disabled, so not tabbable). I added a capacity key to the fixture only; no assertion changed. qa's two new test files untouched."
  ],
  "failures": [],
  "pending": [
    {"item": "qa verify (light): rerun the 42 tests plus full npm test", "owner": "qa"},
    {"item": "User visual verdict in both themes, 375px, reduced motion; see State list in the dev report for what was looked at running vs reasoned", "owner": "orchestrator"},
    {"item": "Possible follow-up: queue-model/overlay-model rows now carry type; no ticket needed", "owner": "orchestrator"}
  ]
}
```

# 228 developer handoff

Done: model, client dispatch, full ready list, slot strip, per-row Role select and Run, dispatch card, refusal line. Bridge untouched.

Looked at running (Playwright screenshots, throwaway script deleted): light 1440 with 429 stub, dark at room 0 with dispatch card, light at 375px. Reasoned from code only: reduced motion, focus ring, no-snapshot and no-capacity strip text, Starting... state, usage note, refusal clearing, demo title, stale-lock note beyond the screenshots (lock row and note were in shot).
