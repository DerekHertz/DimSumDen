# den-layout/02 qa verify handoff

```json
{
  "ticket": "den-layout/02-scene-becomes-the-den",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify complete at 52aac2c. All 2049 tests pass, smoke:ui passes all 10 checks, all acceptance criteria tested and passing.",
  "artifacts": [
    "branch den-layout/02-scene-becomes-the-den, head 52aac2caa427754fda38c682be3df9250b140314",
    "qa verify: npm test 2049 pass / 0 fail",
    "qa verify: npm run smoke:ui 10 checks, all PASS",
    "qa verify: handoff den-layout/02 at qa verify stage"
  ],
  "decisions": [
    "All three test file edits (handoffs.test.mjs, frontend.test.mjs, tally-expand.test.mjs) are updates to match the new scene structure (imports, coordinates, skeleton bones, camera math), not assertion weakening. Tests still verify the same behavior.",
    "All 5 specify test files pass: den-scene-mounted.test.mjs (criterion 2,4,1), reachability.test.mjs (criterion 3), agents.test.mjs, review.test.mjs, restaurant.test.mjs (criterion 4). Criterion 5 tests via full npm test and smoke:ui.",
    "Acceptance criteria mapped: criterion 1 (scene loaded, Den.jsx not rendered) → den-scene-mounted.test.mjs live app test; criterion 2 (review build gone) → 3 package.json/filesystem tests; criterion 3 (reachability passes) → reachability.test.mjs; criterion 4 (PR #162 tests pass under 90s) → den-scene-mounted.test.mjs PR tests wrapper; criterion 5 (npm test + smoke:ui pass) → both runs completed and passing."
  ],
  "failures": [],
  "pending": []
}
```

## QA verify report

**Verdict: QA pass**

**Test results:**
- npm test: 2049 pass, 0 fail (full suite re-run after developer's final smoke-ui fix)
- npm run smoke:ui: all 10 checks PASS
- All specified test files pass: den-scene-mounted.test.mjs, reachability.test.mjs, agents.test.mjs, review.test.mjs, restaurant.test.mjs

**Acceptance criteria coverage:**
1. Scene becomes the den: den-scene-mounted.test.mjs live app test verifies RestaurantDen loads, Den.jsx never loaded, canvas mounts without error → PASS
2. Review build gone: den-scene-mounted.test.mjs verifies review:dev, review:build scripts removed, vite config/index.html/build script/main.jsx gone, package.json references no deleted files → PASS
3. Reachability passes: reachability.test.mjs graph walks main.jsx and verifies all code reachable or test-only → PASS
4. PR #162 tests on main: den-scene-mounted.test.mjs runs agents/review/restaurant tests in one process, all pass in ~4 seconds (well under 90s limit) → PASS
5. Full test suite and smoke: npm test 2049/2049, npm run smoke:ui all checks → PASS

**Test file edits reviewed:**
- handoffs.test.mjs: Updated Den → RestaurantDen (component rename), regex still checks import and usage with frontier prop, assertion strength unchanged
- frontend.test.mjs: Updated Knee_L → Hip_L (PR #162 skeleton) and pad coordinates to match site plan (-5.1,-6.8)/(5.1,-6.8) → (-4,-8.5)/(4,-8.5), assertions still verify skeleton and positioning
- tally-expand.test.mjs: Updated imports from banquet-layout/iso-projection to procedural/camera/bindings, rewrote screenOf() to use orthographic camera math instead of isometric, still verifies screen coordinate calculation for tally

**Files in scope:**
- apps/ui/src/App.jsx (mounted RestaurantDen)
- apps/ui/src/review/* (ported from PR #162)
- apps/ui/src/scene/procedural/* (scene modules, ported and updated)
- apps/ui/src/scene/handoffs.test.mjs, procedural/frontend.test.mjs, tally-expand.test.mjs (updated for new scene)
- apps/ci-cd/smoke-ui.mjs (retargeted checks, dropped walk check per scope)

**No issues found.** All criteria passing, test edits appropriate, changes in scope.
