```json
{"ticket": "dimsumden-ui-v0/08", "cell": "qa", "mode": "verify", "current_step": "Light verify done: QA pass.",
 "artifacts": [],
 "decisions": ["Light verify (I ran specify); no escalation needed"],
 "failures": [],
 "pending": [{"item": "security review, then designer review of framing and chip overlap", "owner": "security"}]}
```

## State
Branch `feat/dimsumden-ui-v0-08-scene-from-state` at 388318c. Verdict: QA pass.

## Checks
- `npm test`: 567 tests, 567 pass, 0 fail, 0 skipped, 0 todo.
- `git diff 13a9eb0 HEAD -- apps/ui/src/scene/scene-from-state.test.mjs`: empty. No assertion removed or loosened.

## Criterion to test map
- AC1 table test over snapshots: apps/ui/src/scene/scene-from-state.test.mjs (16 test blocks, 35 cases).
- AC2 browser smoke: human-verified (marked by specify). Developer reports a throwaway playwright run (12 chips, no console errors); not re-run by qa.
- Scope add `--model` flag: scripts/log-cell-model.test.mjs (4 tests, developer-written, passing).

## Files outside the ticket's scope (listed, not judged)
None clearly outside. Touched beyond the scene function: apps/ui/src/App.jsx, styles.css, scene/Den.jsx, scene/ChipLayer.jsx, scene/chip-model.mjs and its test (renderer part of the ticket), scripts/log-cell.mjs and its test (user-approved scope add).

## Next step
Security review, then designer review.

## Gotchas
Developer notes chip overlap at stacked crown plushes; Den.jsx/ChipLayer.jsx rendering is untested by automation.
