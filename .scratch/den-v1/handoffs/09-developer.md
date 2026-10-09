```json
{
  "ticket": "den-v1/09-demo-mode",
  "cell": "developer",
  "current_step": "Demo mode implemented on feat/09-demo-mode (1168db0). qa's four test files pass unedited; npm test 3170 tests, all green after the reachability exception; vite build and smoke:ui pass. Next: qa verify (light), then user visual sign-off (ready-for-human), then risk-check.",
  "artifacts": [
    {"path": "apps/ui/src/demo/demo-fixture.mjs", "note": "the recorded events: developer x2 (one split-off), qa; tool calls, one pending approval, one ack; loopMs 40000"},
    {"path": "apps/ui/src/demo/demo-replay.mjs", "note": "createDemoReplay: pure clock-driven rebuild of snapshot, transcripts and acks"},
    {"path": "apps/ui/src/demo/demo-card.mjs", "note": "demoCard: T/A/D greyed, F by recorded lines"},
    {"path": "apps/ui/src/demo/demo-mode.mjs", "note": "createDemoMode: ?demo=den, enter/leave via replaceState, announcements, onChange"},
    {"path": "apps/ui/src/demo/DemoControls.jsx", "note": "useDemoMode, badge, button, strip, polite live region"},
    {"path": "apps/ui/src/demo/README.md", "note": "how to re-record"},
    {"path": "apps/ui/src/App.jsx", "note": "wires the mode, demoCard on the card, replayed transcripts, exit walk and close panels on change"},
    {"path": "apps/ui/src/styles.css", "note": "demo badge, button, strip, loop turn, tokens only"}
  ],
  "decisions": [
    "replay.stop() marks the current state object running:false in place (the qa test needs the same reference with running false), without notifying.",
    "Fixture is hand-authored in the event shape (no recorder exists); README says so and how to edit it.",
    "The existing .den-entry (Enter the den) moved from top 88px to 120px so the 72px Watch the demo button does not overlap it. Check this against the mockup.",
    "Added an exception for apps/ui/src/demo/README.md in apps/ui/reachability.test.mjs (qa pinned the README location; the test flagged it as unreachable).",
    "Mode state also exposes loops (for the strip's loop-glyph turn) and the mode forwards statusFor to the replay (the card's Message received line).",
    "useSession() still runs in App as before; Demo mode itself imports no session or bridge client, and the fixture has no gates or requests so the Needs you card never calls a steering route."
  ],
  "failures": [],
  "pending": [
    {"item": "qa verify (light): diff the four test files against 852b0fd", "owner": "qa"},
    {"item": "User visual critique of badge, strip, button placement (including the den-entry shift), F-greyed card, loop turn, reduced motion, phone layout; I did not review against the mockup (not accessible) or run code-review (context budget)", "owner": "orchestrator"}
  ]
}
```

State: implemented, committed, tests green, ready for qa verify.

Not done: the /code-review pass (context warn) and a browser look at the real 3D den in Demo mode beyond smoke:ui.
