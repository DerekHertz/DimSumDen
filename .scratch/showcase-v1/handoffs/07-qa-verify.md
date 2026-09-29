# 07 qa verify (light): stele beside the Cubs basket

## State
```json
{"ticket": "showcase-v1/07-tally-stele", "cell": "qa", "mode": "verify", "current_step": "light verify at 0dba375: QA pass",
 "artifacts": ["apps/ui/src/scene/tally-stele.test.mjs", "apps/ui/src/scene/tally-face.test.mjs", "apps/ui/src/scene/roam.test.mjs", "apps/ui/src/scene/banquet-layout.test.mjs"],
 "decisions": ["QA pass: 780/785 pass, 0 skipped; the 5 failures are browser smoke tests, expected in cloud", "test files unchanged between 418020e and 0dba375", "board fixture tests passed here, so the developer's signing timeouts are environmental (no comparison against de9451b needed)"],
 "failures": ["5 smoke failures (tests 17, 18, 19, 20, 24): smoke --url x3, smoke:ui, npm run smoke; all ERR_ASSERTION, no browser in cloud"],
 "pending": [{"item": "security review", "owner": "security"}, {"item": "Design system Stele entry wording: 'beside the Cubs basket'", "owner": "designer"}]}
```

## Steps
1. npm test at 0dba375: 785 tests, 780 pass, 5 fail, 0 skipped. Failures are the browser smoke set only. All board tests passed this run, so the earlier git-signing timeouts did not reproduce and are not caused by the branch (the diff touches only three scene files).
2. `git diff 418020e HEAD` on test files: empty. No assertion removed or loosened.
3. Criterion map:
   - Geometry, placement, occlusion unit test: tally-stele.test.mjs 7-14 (placement, size, grounded, clear of table/Bao/stalls, perches, cubs, roam obstacle).
   - Face in qi teal on stone; name unchanged: tally-stele.test.mjs 15, 16; tally-face.test.mjs 1-6.
   - Click/Enter opens the dashboard without scrolling: tally-face.test.mjs 6, tally-stele.test.mjs 16.
   - smoke:ui passes: cannot run in cloud (fails here, expected); human-verified.
   - Browser check: user approved 0dba375 (ticket comment).
4. Files outside scope: none. Changed since de9451b: TallyFace.jsx, banquet-layout.mjs, roam.mjs and the three test files, all scene files for this ticket.
