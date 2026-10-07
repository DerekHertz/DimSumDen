# den-layout/02 developer handoff (complete, to in-review)

```json
{
  "ticket": "den-layout/02-scene-becomes-the-den",
  "cell": "developer",
  "current_step": "All pending items from the partial handoff are done at commit 52aac2c on den-layout/02-scene-becomes-the-den. Reachability 7/7, den-scene-mounted 6/6, tally-expand 18/18, frontend and handoffs tests green. Full npm test was 2048 pass / 1 fail (smoke-ui.test, caused by the zoom and pan checks); that is fixed and npm run smoke:ui now prints all PASS. The final full npm test was NOT re-run after that last smoke fix (context budget); smoke-ui.test.mjs only wraps smoke:ui. /code-review was not run.",
  "artifacts": [
    "branch den-layout/02-scene-becomes-the-den, head 52aac2caa427754fda38c682be3df9250b140314",
    "apps/ui/src/scene/procedural/bindings.mjs (STATIONS and PADS moved to the site plan: steamers (-8.8,-7.5), front-of-house (8.8,-7.5), tea (-12.5,2.5), pantry (12.5,2.5), Library (-4,-8.5), Drum (4,-8.5))",
    "apps/ui/src/scene/procedural/camera.mjs (frame base 15.3 -> 20 and 23.4 -> 30.6; pan clamp +-14 / +-12)",
    "apps/ci-cd/smoke-ui.mjs (walk check dropped with a note; zoom and pan checks measure Library and Drum signs)"
  ],
  "decisions": [
    "walking-bao.mjs deleted (reachability test 2); den-test-helpers.mjs now builds the den with review/walking-panda.mjs.",
    "Headless screenshots at 1440x900 and 375x667 show the whole site plan and the Tally in frame at the default zoom. DEN_TARGET unchanged. Dragon dance and dining table at the bottom are partly cut off at 1440x900; zoom out shows them.",
    "At the nearest zoom the four station signs fall off screen, so the smoke zoom and pan checks use the Library and Drum signs (8 units apart, always visible).",
    "Old-den pins in existing tests updated: handoffs.test.mjs (RestaurantDen import and tag), frontend.test.mjs (Knee_L to Hip_L since the PR panda has no knee bones; Library and Drum pad coordinates), tally-expand.test.mjs (screenOf now uses procedural/camera.mjs and TALLY_ANCHOR instead of iso-projection and banquet-layout). qa's tests were not edited."
  ],
  "failures": [],
  "pending": [
    {
      "item": "qa verify: run full npm test once (last full run before the final smoke fix had only the smoke-ui failure) and review the edits to the three existing test files listed under decisions.",
      "owner": "qa"
    },
    {
      "item": "Station sign labels (.station-label) render as 1 px elements in the headless run; not investigated, pre-existing ChipLayer behaviour. Dead scene modules iso-projection.mjs, banquet-layout.mjs may now be only test-reachable; reachability passes so left alone.",
      "owner": "orchestrator"
    }
  ]
}
```
