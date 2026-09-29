```json
{"ticket": "dimsumden-ui-v0/10-panel-gates", "cell": "qa", "mode": "verify", "status": "in-review", "current_step": "light verify done: QA pass", "branch": "feat/dimsumden-ui-v0-10-panel-gates", "artifacts": ["apps/ui/src/panel/gates-model.test.mjs"], "decisions": ["Browser smoke is human-verified per specify; left to designer review"], "failures": [], "pending": [{"item": "browser smoke of Approve (one request line, shows pending)", "owner": "designer"}]}
```

# Handoff: 10 qa verify

## State
QA pass (light verify at 9130cce). `npm test`: 631 of 631 pass, 0 skipped.

## Checks
- Test file `apps/ui/src/panel/gates-model.test.mjs` is unchanged between specify (0be8d41) and HEAD: no removed or loosened assertions.
- Criterion 1 (Approve creates one request line, shows pending): browser smoke, human-verified. Partly covered by the submitGate POST test and the approval-sent line test.
- Criterion 2 (handled request clears its pending mark): covered by test "a handled request clears its pending mark (ticket event with request null)" at gates-model.test.mjs:73.
- Files touched: apps/ui/src/App.jsx, apps/ui/src/panel/Panel.jsx, apps/ui/src/panel/gates-model.mjs, apps/ui/src/styles.css. All in scope.

## Next step
Designer review with browser smoke, then security.

## Comments
None.
