# den-iso-v1/04: developer 4 (fix round for qa verify 2)

Branch `feat/scene-dressing04` at `c972a7b` (on top of 6f04653). Fixed qa findings 1 and 2. Pad and bamboo visibility untouched, as instructed.

```json
{
  "ticket": "den-iso-v1/04-scene-dressing",
  "cell": "developer",
  "current_step": "Fixed the clipped pad label and added a node test that builds the dressing group. npm test 1680/1680 and smoke:ui 10/10 on c972a7b. Committed; ready for qa verify.",
  "artifacts": [
    {"path": "apps/ui/src/scene/pad-chip.mjs", "note": "PAD_CHIP_PX (adds minFont 14, padX 24) and pure fitChipFont(measureAt, px)"},
    {"path": "apps/ui/src/scene/pad-chip.test.mjs", "note": "4 tests: fits, shrinks, floor, largest fitting font"},
    {"path": "apps/ui/src/scene/dressing.mjs", "note": "buildDressing, readDressingTokens, DRESSING_TOKENS moved verbatim out of Backdrop.jsx"},
    {"path": "apps/ui/src/scene/dressing.test.mjs", "note": "builds the group with literal tokens; asserts stones (instanced count = stepStones().length), 2 pad groups with fill and dashes at layout positions, one bamboo group per bambooStalks()"}
  ],
  "decisions": [
    "Finding 1: Den.jsx padChipTexture now measures the label with canvas measureText and shrinks the font (26 px down to a 14 px floor) until it fits the 320 px canvas minus 24 px side padding. Canvas and sprite size are unchanged, so the chip footprint is the same. Chosen over widening the canvas because a wider chip would cover more of the 1.3-wide disc (an open designer point).",
    "Finding 2: Node cannot import .jsx, so buildDressing moved to dressing.mjs; Backdrop.jsx imports it. backdrop-dressing.test.mjs (mount check) is untouched and still passes.",
    "The wiring test scene-dressing-wiring.test.mjs greps .jsx files for stepStones and bambooStalks, which now live in dressing.mjs, so I added dressing.mjs to its source list (two lines: sceneSources). This is an edit to a qa-written test; the assertions are unchanged. Reject it if you would rather the test stay verbatim.",
    "The stone count is 43, not the 48 qa's pending item named: STONE_RING.count is 48 but the footprint rule drops 5 steps. The test asserts the group matches stepStones().length (and is > 0 and <= 48), not a literal 48."
  ],
  "failures": [
    "Not done: no real-browser render of the fitted chip. fitChipFont is covered by a pure test with a stand-in measure; the real glyph width comes from canvas measureText, so qa's real-render check at 1440x900 should confirm the text no longer clips."
  ],
  "pending": [
    {"item": "Verify: rerun the real render at 1440x900 and 375x667 and confirm the Library and Drum chips read whole", "owner": "qa"},
    {"item": "Ruling on pad and bamboo visibility at 1440x900 (qa verify 2 observations)", "owner": "designer"},
    {"item": "Criterion 5: the user inspects the den in the browser", "owner": "user"}
  ]
}
```

## Checks run

- `npm test`: 1680 pass, 0 fail (1673 before plus 7 new tests).
- `npm run smoke:ui`: 10/10 PASS.
- Files changed vs 6f04653: Backdrop.jsx, Den.jsx, dressing.mjs, dressing.test.mjs, pad-chip.mjs, pad-chip.test.mjs, scene-dressing-wiring.test.mjs. All in `apps/ui/src/scene/`.
