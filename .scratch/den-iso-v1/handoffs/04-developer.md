# den-iso-v1/04: developer handoff

Branch `feat/scene-dressing04`, commit `725132b`, on qa's tests commit `f6f7797`. Product files only: `banquet-layout.mjs`, `Backdrop.jsx`, `Den.jsx`. No test edited.

`npm test`: 1671 tests, 1670 pass, 1 FAIL (below). All 25 of qa's failing tests pass. `npm run smoke:ui`: all PASS.

```json
{
  "ticket": "den-iso-v1/04-scene-dressing",
  "cell": "developer",
  "current_step": "Dressing built and committed (725132b). 25 of qa's tests green; one old test, the horseshoe 1.8 tabletop check, is red because of the +-3.0 move and needs a ruling.",
  "artifacts": [
    {"path": "apps/ui/src/scene/banquet-layout.mjs", "note": "STALLS x +-3.0; STONE_RING, stepStones, DORMANT_PADS, BAMBOO_CLUSTERS, BAMBOO_STALK, bambooStalks"},
    {"path": "apps/ui/src/scene/Backdrop.jsx", "note": "Dressing: instanced paver stones with contact shadow, dashed pad rings, bamboo stalks with joints and a leaf cone"},
    {"path": "apps/ui/src/scene/Den.jsx", "note": "PadChips: canvas-texture sprite per pad, text from DORMANT_PADS label, name/userData from ariaLabel"}
  ],
  "decisions": [
    "Footprint rule: a step is dropped when its stone disc (radius 0.17) would touch a kiosk platform (counter + 0.15 each end, 0.65 deep, turned by stallYaw), the table (r 1.3), the hamper (r 0.55) or the Tally (1.1 x 0.12). Result is within qa's bounds (36 to 47 stones).",
    "Pad labels: 'Library · coming online' and 'Library, coming online' (visible, aria).",
    "Visible pad chip is a THREE.Sprite in Den.jsx, not a DOM chip: ChipLayer.jsx and station-labels.mjs are outside the ticket's files, and station-labels tests pin the label list. Sprite is constant world size, so it scales with zoom (a DOM chip would not).",
    "Colours read from page tokens with tokens.json fallbacks: paver and ground-shadow are NOT yet in styles.css (ticket 07's file), so they use the fallbacks #f3ead4 and black at 12%. Stroke of the pads is line-strong, fill surface-100 at opacity-dim.",
    "Not run in a browser by me (no browser tool); smoke:ui loads the app and passes. Shapes, colours, dashes and shading are for the human verdict (criterion 5)."
  ],
  "failures": [
    "horseshoe-layout.test.mjs 'default-camera counter rectangles clear kiosks, Bao and table' fails: steamers counter overlaps table. Not fixable inside my files (see pending)."
  ],
  "pending": [
    {"item": "RULING on horseshoe-layout.test.mjs:52-73. At 1440x900 the Steamers counter rect is x 349.05..564.12, y 396.7..497.3; the table rect (r 1.8 at y 0.7, the drawn tabletop) is x 561.95..878.05, y 448.2..630.7. They overlap 2.17 px in x (and 49 px in y). Front of House mirrors it (x 875.88..1090.95). At r 1.7 the table rect starts at 570.7 and passes; at TABLE.radius 1.3 it starts at 605.9 and passes. The counter rect is fixed by pinned numbers (x -3.0, z -1.4, stallWidth 2.25, yaw 0.52, counter y 1.1), so no layout change in scope clears it; x would have to be about +-3.03 or more (2.17 px / 87.8 px per unit = 0.025). Proposals: (a) use TABLE.radius in that test, as default-framing.test.mjs already does; (b) make the test depth-aware like qa's scene-dressing-framing 'covers' (the counter is 1.4 behind the table's centre, so the table is drawn over it, and the overlap is the bounding rects, not a real overlap); (c) designer or user confirms the 2 px is acceptable. Not changed by me.", "owner": "orchestrator"},
    {"item": "Pad chips are sprites; if the designer wants them in the DOM chip layer with surface-glass, that needs ChipLayer.jsx / station-labels.mjs (and the scene aria-label in App.jsx, which should list the pads: scene label is ticket 07's file).", "owner": "designer"},
    {"item": "Add --paver and --ground-shadow CSS variables to styles.css (tokens.json has them; ticket 07 owns the file). Until then the fallbacks apply.", "owner": "orchestrator"},
    {"item": "Verify: criterion 5, the user inspects the den in the browser and says it matches the frame", "owner": "qa"}
  ]
}
```
