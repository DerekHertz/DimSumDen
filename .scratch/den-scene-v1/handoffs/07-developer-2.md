# den-scene-v1/07 developer 2: old tests migrated, qa's 25 tests green, one cross-test conflict for qa

Branch `feat/floating-cards07`, last commit "den-scene-v1/07: migrate old tests and smoke:ui to the floating cards; camera-store and overlay-model unit tests" (on top of qa's c4ff513). No app code changed except one CSS comment move.

```json
{
  "ticket": "den-scene-v1/07-sidebar-overlays",
  "cell": "developer",
  "current_step": "Remaining work from 07-developer.md done: old tests and smoke-ui migrated, unit tests added, floating-cards + tally-expand 43/43 green serially, smoke:ui 10/10, npm test 1687 pass 1 fail (the failure is qa's test file, see failures). Code review run; ready for qa verify",
  "artifacts": [
    "branch feat/floating-cards07",
    "apps/ui/src/scene/camera-store.test.mjs",
    "apps/ui/src/overlay/overlay-model.test.mjs",
    "apps/ui/src/scene/tally-card-wiring.test.mjs",
    "apps/ui/src/scene/tally-expand.test.mjs",
    "apps/ui/src/brand.test.mjs",
    "apps/ci-cd/smoke-ui.mjs",
    "apps/ui/src/styles.css"
  ],
  "decisions": [
    "Old tests migrated by inverting the removed-sidebar assertions: usage meter must be absent from App.jsx and Cards.jsx and the Tally face still reads usage-meter-model; scrollState reads main.scene instead of .panel; 'aside' selectors became '.card'; brand h1 is read from overlay/Cards.jsx and the display-font selector is .logo-pill h1",
    "smoke-ui: queue reads [data-overlay=stations] .queue-title; the approve check uses the Needs you card (picks the merge ticket's request row if another leads) and the 'Approve' button; the 375x667 style hack for .shell/.panel is removed because the scene is now the full viewport",
    "styles.css: a trailing comment after the .scene-more rule was parsed by brand.test.mjs as part of the next selector (.chip-tally); moved inside the rule body",
    "New unit tests use literals (levels 1, 0.75, 0.55; zoom range 0.55 to 1.2; relative-age strings), not recomputed values",
    "Test 18 slowness was a harness effect (qa added lightenScene); it now passes. The 80-click clamp is covered at the store level too (camera-store.test.mjs)"
  ],
  "failures": [
    "npm test: scripts/organ-to-station.test.mjs 'no bare word organ' fails on apps/ui/src/overlay/floating-cards.test.mjs:579, where qa's biology-word regex contains the bare word organ (/\\b(organism|organ|cell|...)\\b/). I did not edit qa's file. Fix is qa's: a 'was: organ' note on that line or building the regex from parts; or the orchestrator exempts the file",
    "Code review (Standards, scout on sonnet) found no hard violations; judgement-call smells left as is: duplicated exclusive-open logic for the two cards on phone; a/d/m key map in two places (Cards.jsx onKeyDown and Decision); station data in five parallel maps in overlay-model.mjs; LEVELS in Bottom.jsx duplicates LEVEL_ZOOM keys; gate name derived by regex in needsYouModel (belongs in gates-model)",
    "Code review (Spec) deviations for the designer or orchestrator to decide: (1) the stations card shows 'N open · M ready' and a 'Next on the susan' list of 3, not the ticket's 'Queue / N ready · next 8 on the susan' with 8 rows; (2) the Stations & queue card starts collapsed; (3) the intent bar uses a local autonomy chip, not AutonomyControl compact (no bridge intent endpoint); (4) extras: Note field on the Needs you card, inline PandaFace in the logo pill. qa's tests pass as built, so I did not change them"
  ],
  "pending": [
    {
      "item": "qa: fix the 'organ' word in floating-cards.test.mjs:579 so scripts/organ-to-station.test.mjs passes; then verify (light verify: npm test, smoke:ui)",
      "owner": "qa"
    },
    {
      "item": "Designer review at desktop and phone, light and dark; decide the Queue copy and row count, Stations card default open or closed, keys m/j/k, 16px vs 18px station dot, eyebrow case, Level 2/3 zoom values",
      "owner": "designer"
    }
  ]
}
```

## Numbers

- `node --test --test-concurrency=1 floating-cards.test.mjs tally-expand.test.mjs`: 43 pass, 0 fail, 0 skipped.
- `npm run smoke:ui`: 10 pass, 0 fail.
- `npm test` (run by scout while the changes were uncommitted in the worktree): 1688 tests, 1687 pass, 1 fail (organ word above). brand.test.mjs re-run after the CSS fix: 9 pass.
- New unit tests: camera-store 7, overlay-model 8; all pass.
