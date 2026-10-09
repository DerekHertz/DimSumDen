```json
{
  "ticket": "den-v1/09-demo-mode",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify of feat/09-demo-mode at 1168db0 against specify commit 852b0fd: QA pass. Suite result taken from the developer's saved npm test output (3170 pass, 0 fail, 0 skipped); not re-run, per dispatch. Test files unchanged since specify. Ticket stays in-review; next is the user's visual sign-off (ready-for-human) before risk-check.",
  "artifacts": [
    {"path": "apps/ui/src/demo/demo-replay.test.mjs", "note": "unchanged since 852b0fd"},
    {"path": "apps/ui/src/demo/demo-card.test.mjs", "note": "unchanged since 852b0fd"},
    {"path": "apps/ui/src/demo/demo-mode.test.mjs", "note": "unchanged since 852b0fd"},
    {"path": "apps/ui/src/demo/demo-wiring.test.mjs", "note": "unchanged since 852b0fd"},
    {"path": "apps/ui/src/demo/demo-test-helpers.mjs", "note": "unchanged since 852b0fd"}
  ],
  "decisions": [
    "Light verify, no escalation: every step applied by rule. The apps/ui/reachability.test.mjs edit is outside my test files, so it is listed under out-of-scope, not judged.",
    "Suite result from /tmp/claude-1000/-home-dhertzell-dimsumden/26c01b15-a7ea-428c-a884-b8c4d7775578/scratchpad/09-tests.txt as the dispatch instructed; the summary lines read tests 3170, pass 3170, fail 0, cancelled 0, skipped 0, todo 0."
  ],
  "failures": [],
  "pending": [
    {"item": "User visual sign-off (ready-for-human) on badge, strip, button, den-entry shift, F-greyed card, loop turn, reduced motion, phone layout (AC6, human-verified)", "owner": "orchestrator"},
    {"item": "Decide whether the reachability.test.mjs exemption for apps/ui/src/demo/README.md is acceptable (existing guard test edited, one path)", "owner": "orchestrator"}
  ]
}
```

# QA verify (light): den-v1/09-demo-mode

Branch: feat/09-demo-mode at 1168db0. Specify commit: 852b0fd. Verify mode: light (dispatch line).

Verdict: **QA pass** (light).

## Light verify steps

1. Test run: not re-run, per the dispatch. Saved developer output (09-tests.txt) shows tests 3170, pass 3170, fail 0, cancelled 0, skipped 0, todo 0. Demo suites appear in the output: "the recorded fixture (read through the driver)", "the replay driver", "no request, no token", "wiring and copy", "entering from the control", "leaving", and the "T, A and D" and "F follows the recorded transcript lines" describes.
2. Test-file diff: `git diff 852b0fd HEAD` for demo-replay.test.mjs, demo-card.test.mjs, demo-mode.test.mjs, demo-wiring.test.mjs and demo-test-helpers.mjs is empty. No assertion removed or loosened.
3. Criterion to test map:
   - AC1 fixture (2+ roles, split-off panda, tool calls, pending approval, ack, re-record note): demo-replay.test.mjs "the recorded fixture (read through the driver)".
   - AC2 replay loops, pandas take over, state and bubbles change: demo-replay.test.mjs "the replay driver".
   - AC3 walk mode and card; T, A, D greyed with "Demo mode: actions are off"; F enabled only with transcript lines, else "Demo mode: no transcript recorded": demo-card.test.mjs "T, A and D" and "F follows the recorded transcript lines".
   - AC4 no steering request, no token: demo-wiring.test.mjs "no request, no token" and "the demo modules contain no network or credential primitive".
   - AC5 enter and leave from the control and from ?demo=den: demo-mode.test.mjs "entering from the control", "leaving", and the ?demo=den cases; control copy in demo-wiring.test.mjs "wiring and copy".
   - AC6 user visual sign-off: human-verified (specify comment, ticket Human-verified section). Not automatable.
   - AC7 npm test green: saved run above.
4. Files touched outside the ticket's listed scope (listed, not judged):
   - apps/ui/reachability.test.mjs: existing guard test. One exemption line added for apps/ui/src/demo/README.md (line 132). Narrow, but it is an edit to an existing test, so the orchestrator or security should look at it.
   - apps/ui/src/scene/procedural/den.css: one line, `.den-entry` top moved from 88px to 120px to clear the new button. Developer flagged it for the visual check.
   - apps/ui/src/overlay/Cards.jsx: 7 lines, routes the nearby card through demoCard. Plausibly in scope (the card).
   - apps/ui/src/App.jsx and apps/ui/src/styles.css: in scope (wiring, badge, strip, button).

## Notes

- Developer's own note: /code-review was not run and the browser look at the real 3D den beyond smoke:ui was not done. Both are part of the human visual sign-off.
- Failed calls: none.
