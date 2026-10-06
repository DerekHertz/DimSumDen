# den-layout/02 developer handoff (partial, context limit)

```json
{
  "ticket": "den-layout/02-scene-becomes-the-den",
  "cell": "developer",
  "current_step": "WIP commit a0cf671 on den-layout/02-scene-becomes-the-den: PR #162 modules ported, headgear closure re-homed, RestaurantDen mounted in App. PR's three test files pass (20/20, ~4 s). Not yet run: npm test, reachability, den-scene-mounted browser test, smoke:ui. No visual check done.",
  "artifacts": [
    "branch den-layout/02-scene-becomes-the-den, commit a0cf67114a6a0a1eec3ae322056ec2e57ca12fda (on qa's ece618f)",
    "apps/ui/src/scene/procedural/RestaurantDen.jsx (new host, replaces Den.jsx)",
    "apps/ui/src/review/*.mjs and apps/ui/src/scene/procedural/{restaurant,panda-settings}.mjs ported from origin/codex/lively-den-scene-lab",
    "apps/ui/src/scene/procedural/{headgear,gear-object,station-hues}.mjs restored from 1317833^ into procedural/"
  ],
  "decisions": [
    "Re-homed headgear, gear-object, station-hues under src/scene/procedural/ (not src/scene/, headgear is on the reachability gone-list). restaurant.mjs imports changed to ./headgear.mjs and ./gear-object.mjs.",
    "RestaurantDen.jsx mounts only the scene world (the LabWorld 'scene' branch of PR's SceneLab: createDenScene, prepareReviewLayout, compactEnvironment, restaurant details, leisure, landscape, construction pads, review agents, sky/fog/lights) inside App's existing Canvas. App overlays, Cards, ChipLayer, TallyCard, CameraRig and explorer are untouched, so floating-cards and tally-expand should still hold.",
    "Dark colour scheme picks the 'lantern' sample, otherwise 'morning'.",
    "createLiveDenController gained option manageResidents (default true). RestaurantDen passes false so the controller does not hide den.crew and roamers, which the review agents own. Controller still places live ticket pandas, frontier baskets and tally rods (keeps controller, bindings, explorer and walk reachable, per the ticket comment).",
    "review-data.mjs must stay: review.test.mjs imports normalizeReview and reviewHtml from it, and reachability test 2 would orphan it. RestaurantDen uses loadReview() so the den honours the saved visual direction and panda settings. If that feels contrived, an alternative is to mark it differently, but tests cannot be edited.",
    "git rm'd standalone-lab pieces: Den.jsx, SceneLab.jsx, PandaEditor.jsx, scene-lab.css, review/review.css, review/main.jsx. Did not copy review.vite.config.mjs, review/index.html, build-den-review.mjs, or PR's package.json review scripts, README and .gitignore changes (never ported, so those files and scripts do not exist on this branch)."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Run node --test on apps/ui/reachability.test.mjs and fix orphans. Expect old den modules now unreachable: walking-bao.mjs (main's, replaced by review/walking-panda.mjs), maybe bao-related or den.css users. Delete them with their tests, or keep reachable. Check den-scene.mjs, compact.mjs, controller.mjs, explorer.mjs, walk.mjs, bindings.mjs stay reachable (test 2 and test 1).",
      "owner": "developer"
    },
    {
      "item": "Run apps/ui/den-scene-mounted.test.mjs (live Chromium mount), then npm test in full (delegate to scout). Existing tests that may break: frontend.test.mjs (camera framing, STATION_LABELS projected in frame, controller/Den expectations), walk.test.mjs, anything importing the deleted Den.jsx.",
      "owner": "developer"
    },
    {
      "item": "Camera and labels: bindings.mjs STATIONS, PADS, STATION_LABELS, TALLY_ANCHOR, DEN_TARGET and camera.mjs framing (half height 15.3, clampTarget +-10/9) describe the OLD den. The new site plan (review/site-plan.mjs REVIEW_STATIONS at (+-8.8,-7.5) and (+-12.5,2.5), ROLE_HOMES product (-4,-8.5), architect (4,-8.5), ground radius 25, tally still at (2.62,0,6.05)) is wider. Screenshot the app (headless, scripts via apps/ci-cd/launch-options.mjs and light-scene.mjs) and retarget labels, default frame and pan limits so every station sign and the tally are in frame. frontend.test.mjs pins the old projected-label framing, so update it only if the ticket scope allows; qa's tests do not pin camera numbers.",
      "owner": "developer"
    },
    {
      "item": "smoke:ui per user scope: retarget camera-fit (1440x900 and 375x667), wheel-zoom and drag-pan checks to the new scene, drop the 'walk: Enter the den' check (04 re-adds it). Edit apps/ci-cd/smoke-ui.mjs and smoke-ui.test.mjs if it pins the dropped check. Keep the 'Enter the den' button wiring in App untouched.",
      "owner": "developer"
    },
    {
      "item": "Delete other dead code the old den left (check with reachability), then /code-review, final npm test and npm run smoke:ui, fresh commit, handoff, board release --status in-review.",
      "owner": "developer"
    }
  ]
}
```

## Notes for the next developer

- `git diff 891242b...origin/codex/lively-den-scene-lab` lists the 28 PR-owned files; never merge that branch. Of those, everything except the standalone-review files and SceneLab-family files is on this branch.
- Screenshot before touching the camera: PR's own lab used a perspective camera (30,26,40, fov 42); the app uses an orthographic iso camera in procedural/camera.mjs, so framing will differ.
- Controller.update calls den.update itself, so RestaurantDen calls details, leisure and agents updates in addition but not den.update.
- Context: ended at about 99k because the reads of SceneLab.jsx, tests and smoke-ui were large. Work was committed first.
