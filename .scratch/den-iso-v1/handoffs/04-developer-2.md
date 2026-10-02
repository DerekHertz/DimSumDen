# den-iso-v1/04: developer handoff 2 (horseshoe test ruling applied)

Branch `feat/scene-dressing04`, commit `ef7d73a` (on `725132b`). Supersedes the "RULING" item of `04-developer.md`. `npm test`: 1671 of 1671 pass. `npm run smoke:ui`: all PASS.

```json
{
  "ticket": "den-iso-v1/04-scene-dressing",
  "cell": "developer",
  "current_step": "User ruling applied: the horseshoe table-vs-counter check compares true screen outlines. Suite green, smoke green, committed ef7d73a. Ready for qa verify, which should review this test change.",
  "artifacts": [
    {"path": "apps/ui/src/scene/horseshoe-layout.test.mjs", "note": "table-vs-counter assertion now a separating-axis test on the tabletop disc and the counter top face; a comment explains it"}
  ],
  "decisions": [
    "What changed (test 'default-camera counter rectangles clear kiosks, Bao and table'): only the table-vs-counter assertion. The tabletop stays radius 1.8 at y 0.7 (128 points), the +-3.0 move and every other assertion stay (counter-vs-Bao and counter-vs-counter still compare bounding rectangles, same strictness).",
    "The rule: a tabletop and a counter occlude each other only if their actual screen outlines share a pixel. Both are flat convex shapes on screen (a disc and a slab), so the test uses a separating-axis check on the outlines, with the same 1e-9 slack as the old rectangle check. The failure message names which is nearer (mean depth toward the camera, as in scene-dressing-framing's 'covers' check).",
    "Numbers at 1440x900: Steamers counter bounding rect x 349.05-564.12, y 396.7-497.3; tabletop rect x 561.95-878.05, y 448.2-630.7, so the rects overlap by 2.17 px. The true outlines do not touch: the counter's inner corner (world -1.78, 1.0, -1.53) lands at 564.12, 440.66, above the tabletop's far rim (y 448.2), and the disc's left edge at that height has already curved in. Front of House mirrors it.",
    "Depth alone could not give this ruling. By scene-dressing-framing's depth rule the table (mean depth 0.57) is nearer than the Steamers counter (0.01), so a depth-only skip would still compare them and the rects would still fail; the deciding change is the shape. So depth only labels which one is in front in the failure message, and an overlap fails in either order (as strict as before for the front kiosks, which stand in front of the table).",
    "Not vacuous: I checked with a scratch script that the same routine reports an overlap when a counter is moved to x -2.0 at z -1.0 and none at the real +-3.0 position. The counter corners are reordered into a loop (the test lists them in z-order) before the separating-axis test."
  ],
  "failures": [],
  "pending": [
    {"item": "Verify: review the horseshoe test change above, then criterion 5 (the user inspects the den in the browser against the frame)", "owner": "qa"},
    {"item": "Still open from 04-developer.md: add --paver and --ground-shadow to styles.css (ticket 07's file); the scene aria-label in App.jsx should list the pads; designer decides whether pad chips stay as sprites", "owner": "orchestrator"}
  ]
}
```
