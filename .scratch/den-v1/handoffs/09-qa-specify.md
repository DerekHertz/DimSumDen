```json
{
  "ticket": "den-v1/09-demo-mode",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed on feat/09-demo-mode (852b0fd). All four files fail with Cannot find module for the not-yet-written demo modules. Next: developer writes apps/ui/src/demo/*.mjs, wires App.jsx and the UI, and makes them pass.",
  "artifacts": [
    {"path": "apps/ui/src/demo/demo-replay.test.mjs", "note": "AC1, AC2: fixture content read through the driver, loop, clock purity, statusFor, stop/start"},
    {"path": "apps/ui/src/demo/demo-card.test.mjs", "note": "AC3: demoCard T/A/D greyed, F by transcript lines"},
    {"path": "apps/ui/src/demo/demo-mode.test.mjs", "note": "AC5: URL param, enter/leave, replaceState, onChange hook, announcements"},
    {"path": "apps/ui/src/demo/demo-wiring.test.mjs", "note": "AC4: no network/token (static scan + run with throwing globals and bridge client), App wiring, copy"},
    {"path": "apps/ui/src/demo/demo-test-helpers.mjs", "note": "shared clock, cardsOf, projection (not a test file)"}
  ],
  "decisions": [
    "Interfaces pinned in each test file header: demo-fixture.mjs (DEMO_FIXTURE.loopMs), demo-replay.mjs (createDemoReplay), demo-card.mjs (demoCard), demo-mode.mjs (createDemoMode).",
    "Fixture content is asserted through the driver, not its raw shape: the dev is free to choose frame shapes.",
    "Fixture must include agents with and without transcript lines (my reading of the States table, so both F states show in the demo).",
    "Replay stamps (cells[].lastEventAt, approval expiresAt) are rebased from event time onto now(), so bubbles are fresh and state identity is stable between events.",
    "Agents in the fixture must be held by a ticket of the same ref and role, and agent ids must be stable across loops."
  ],
  "failures": [],
  "pending": [
    {"item": "Implement apps/ui/src/demo/{demo-fixture,demo-replay,demo-card,demo-mode}.mjs and README.md (re-record note naming demo-fixture.mjs); wire App.jsx (createDemoMode or useDemoMode, replay transcripts to TranscriptPanel, demoCard on the nearby card, onChange exits walk and closes panels), the control, badge, strip, polite live region", "owner": "developer"},
    {"item": "User visual sign-off (ready-for-human) before risk-check", "owner": "orchestrator"}
  ]
}
```

State: tests committed, red for the right reason, handoff published.

## Criterion to test map

| Criterion | Test |
| --- | --- |
| AC1 fixture: 2+ roles, split-off panda, tool calls, pending approval, ack, re-record note | demo-replay.test.mjs "the recorded fixture (read through the driver)" (all tests) |
| AC2 replay loop, pandas take over, state, bubbles | demo-replay.test.mjs "the replay driver" (loops, clock purity, restart no pile-up, stop/start) |
| AC3 T/A/D greyed "Demo mode: actions are off"; F by lines else "Demo mode: no transcript recorded" | demo-card.test.mjs (all) |
| AC4 no steering request, no token | demo-wiring.test.mjs "no request, no token" |
| AC5 enter/leave by control and `?demo=den` | demo-mode.test.mjs (all); control copy in demo-wiring.test.mjs "wiring and copy" |
| AC6 user visual sign-off | human-verified |
| AC7 npm test green | developer and verify |

## Human-verified
Badge, strip, button look and placement; focus staying on the button; loop glyph turn and reduced motion; strip hidden under 900px; 44px button under 600px; light/dark contrast; the live-region wording is tested, its being heard is not; walk mode and the card working in the real 3D den (smoke).

## Notes for the developer
- Tests are red now because the four demo modules do not exist. The "touched no global" test redefines fetch, EventSource, WebSocket, XMLHttpRequest, sessionStorage and localStorage with throwing getters; demo code must not read them.
- `useSession()` still runs in App; spec point 5 is met by the demo modules not importing the session or bridge client and by T/A/D being off (no steering route is reachable).
- I could not exercise the tests against an implementation, only check syntax. If a test contradicts the spec, say so in your handoff and don't loosen it; qa verify will diff the test files against 852b0fd.
- I put the re-record note at apps/ui/src/demo/README.md.
- Specify round: this qa cell stopped near 100k context; no known gaps in the criterion map.
