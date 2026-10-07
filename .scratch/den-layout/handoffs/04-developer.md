# den-layout/04 developer handoff

```json
{
  "ticket": "den-layout/04-walk-mode-in-the-new-den",
  "cell": "developer",
  "current_step": "Done at a3dcd59 on den-layout/04-walk-mode-in-the-new-den (on qa's 0b46b9a). qa's 7 tests pass; npm test 2086/0 and smoke:ui 10/0 (run by scout).",
  "artifacts": [
    "apps/ui/src/scene/procedural/walk.mjs: WALK.bounds rectangle replaced by WALK.floorRadius 24.5; isWalkBlocked blocks past hypot(x,z) > 24.5 - 0.26",
    "apps/ui/src/scene/procedural/explorer.mjs: world() obstacles are [...den.obstacles, ...REVIEW_OBSTACLES] (site-plan.mjs)",
    "apps/ui/src/scene/procedural/walk.test.mjs: floor-edge test and long-walk test updated to the circle (qa flagged these two pins)",
    "apps/ci-cd/smoke-ui.mjs: 'walk: Enter the den' check restored verbatim from den-v1/03, dropped note removed"
  ],
  "decisions": [
    "Merge happens in the explorer (a pure-data import from review/site-plan.mjs), the same merge createReviewAgents does. WALK.start unchanged: it was already walkable with room.",
    "Walls are the floor edge (disc radius 24.5), as qa decided; the site plan has no wall objects.",
    "walk.test.mjs edits: the old rectangle pins (-11.65..11.65, -10.4..9.35) became circle pins, and a diagonal case was added. No qa test in walk-new-den.test.mjs was edited."
  ],
  "failures": [],
  "pending": [
    {
      "item": "qa verify: re-run npm test and npm run smoke:ui; human check of the walking feel (camera framing, spawn view) is still the user's",
      "owner": "qa"
    }
  ]
}
```
