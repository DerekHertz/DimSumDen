# den-layout/04 qa specify handoff

```json
{
  "ticket": "den-layout/04-walk-mode-in-the-new-den",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed on tests/den-layout-04-walk-mode-in-the-new-den at 0b46b9a (base d9d2f39). 7 tests: 3 pass now (guards), 4 fail for missing features.",
  "artifacts": [
    "branch tests/den-layout-04-walk-mode-in-the-new-den, commit 0b46b9a (base d9d2f39)",
    "apps/ui/src/scene/procedural/walk-new-den.test.mjs (new)"
  ],
  "decisions": [
    "Seam: createDenExplorer over the den RestaurantDen assembles (createDenScene, prepareReviewLayout, compactEnvironment, leisure, landscape, construction pads, review agents). Tests use explorer.blocked(x,z), explorer.camera.position after enter(), and keyboard events. No test dictates where the obstacle merge happens (den.obstacles, explorer, or a new module).",
    "Root cause found by a probe: the explorer's obstacles are only den.obstacles. Site-plan REVIEW_OBSTACLES (lantern posts, dining table, mahjong table, festival, tea pond, dragon dance, construction pads) are merged only inside createReviewAgents, so the walker passes through them. WALK.bounds is the old rectangle x +-11.65, z -10.4..9.35, so the tea and pantry stations (x +-12.5) and every leisure zone (z 13 to 14, x +-16 to 17) are unreachable. The floor is a cylinder of radius 24.5 at the origin.",
    "Walls are read as the floor edge (radius 24.5, prepareReviewLayout) since the site plan has no wall objects; the boundary bamboo ring sits at radius 20.5 to 22. The tests require blocked past radius 24.5+0.26+0.2 and reachability of the zones, not a particular wall shape.",
    "Probe check (reverted, not committed): bounds replaced by hypot(x,z) > 24.5-0.26 and REVIEW_OBSTACLES added to the explorer's obstacles made 6 of 7 pass (all but the smoke-source test), so the tests are satisfiable.",
    "Spawn: WALK.start (0, 8.95, yaw 0) is already walkable in the new den with 0.65 m clearance, so the spawn test passes now as a guard. It fails if a developer moves the spawn into an obstacle."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Make the 4 failing tests pass: widen the walker's bounds to the new floor (circle radius 24.5), feed it the site plan's obstacles (REVIEW_OBSTACLES plus the moved stalls), and re-add the 'walk: Enter the den' check to apps/ci-cd/smoke-ui.mjs (remove the 'dropped' note). Then run npm test and npm run smoke:ui. The existing walk.test.mjs pins WALK.bounds (-11.65..11.65, -10.4..9.35) in 'walking into the floor edge' and the 'long walk through the real den' test; the developer must update those, and say so in the handoff, since the old floor edge no longer applies.",
      "owner": "developer"
    }
  ]
}
```

## Criterion to test map

All in `apps/ui/src/scene/procedural/walk-new-den.test.mjs`.

| Criterion | Test | State at 0b46b9a |
|---|---|---|
| 1. Walk mode enters, moves, exits with den-v1/03 controls | "walk mode enters, moves with W and exits with Esc on the new den" (also needs about 2.1 m of open floor in front of the spawn) | passes (guard) |
| 2. Blocked by the site plan's stations | "blocked by each of the four station stalls" (centre and four interior points per stall, open floor in front) | fails (tea station is outside the old bounds) |
| 2. Blocked by walls and the rest of the site plan | "blocked by the rest of the site plan" (lantern posts, dining, games, festival, tea, dragon, three construction pads); "cannot leave the garden" (past radius 24.5) | first fails (lantern posts walkable); second passes (guard: old bounds are tighter) |
| 3. Spawn inside a walkable area | "the spawn point is inside a walkable area" (not blocked, on the floor, 0.65 m clearance from REVIEW_OBSTACLES and den.obstacles, outside every stall footprint) | passes (guard) |
| 3 and 2. Site plan is actually walkable | "from the spawn the walker can reach every station and every leisure zone" (flood fill on explorer.blocked, 0.25 m grid) | fails (zones unreachable) |
| 4. smoke:ui | "the walk check is back in smoke:ui" (source match for an active check named "walk: Enter the den" and no 'dropped' note); `npm test` and `npm run smoke:ui` themselves are run by verify | fails |

human-verified: the feel of walking the new den (camera framing, spawn view).

## Notes

- The smoke check itself runs in Chromium under `npm run smoke:ui`; the unit test only guards that it is back. Verify must run smoke:ui.
- `npm test` is red until the developer finishes: 4 failing tests in the new file.
- Final context was about 108k at the last reading: the large reads were den-scene.mjs, site-plan.mjs, agents.mjs and the 02 and 03 handoffs.
