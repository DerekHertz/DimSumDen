# den-iso-v1/04: qa verify 3 (full verify of c972a7b)

Branch `feat/scene-dressing04` at `c972a7b`, detached. Verdict: **QA pass**. Both bounce findings are fixed and checked.

```json
{
  "ticket": "den-iso-v1/04-scene-dressing",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Reran npm test (1680/1680) and smoke:ui (10/10) on c972a7b, diffed the specify tests, read the moved dressing code and rendered the real app at 1440x900 and 375x667. QA pass; criterion 5 and pad/bamboo visibility remain with the user.",
  "artifacts": [
    {"path": "/tmp/claude-1000/-home-dhertzell-dimsumden/42fefd50-55ba-48ef-826e-678b788978a4/scratchpad/qa3-1440x900.png", "note": "real render at 1440x900"},
    {"path": "/tmp/claude-1000/-home-dhertzell-dimsumden/42fefd50-55ba-48ef-826e-678b788978a4/scratchpad/qa3-pads.png", "note": "crop of the Library and Drum chips, whole text"},
    {"path": "/tmp/claude-1000/-home-dhertzell-dimsumden/42fefd50-55ba-48ef-826e-678b788978a4/scratchpad/qa3-375x667.png", "note": "real render at 375x667, Library chip whole"}
  ],
  "decisions": [
    "Finding 1 (clipped chip) fixed: both chips read 'Library . coming online' and 'Drum . coming online' in full at 1440x900, and the Library chip at 375x667 (Drum is off screen there, as before). fitChipFont is a pure function with 4 tests; Den.jsx feeds it canvas measureText.",
    "Finding 2 (nothing proves the dressing is drawn) fixed: dressing.test.mjs builds the real group in node: instanced paver and shadow counts equal stepStones().length (>0, <=48), 2 dormant-pad groups at DORMANT_PADS positions each with fill plus dashes and the label, one bamboo group per bambooStalks() with trunk and leaves. It would fail on an empty dressing. The mount test backdrop-dressing.test.mjs is untouched.",
    "Stone count 43 not 48: accepted. STONE_RING.count is 48, the footprint rule drops 5; asserting against stepStones() with 0 < n <= 48 is right.",
    "Developer's edit to scene-dressing-wiring.test.mjs accepted: it only adds dressing.mjs to the scanned sources (3 insertions, 2 deletions); every assertion is unchanged and the scan is wider, not looser. dressing.mjs was checked to hold the moved code unchanged from Backdrop.jsx at 6f04653."
  ],
  "failures": [],
  "pending": [
    {"item": "Ruling on pad and bamboo visibility at 1440x900 (user's two points). Pad discs sit partly under the grove mound and the chip is wider than the disc; the dressing bamboo is darker but reads as part of the grove", "owner": "designer"},
    {"item": "Criterion 5: the user inspects the den in the browser and says it matches the frame", "owner": "user"},
    {"item": "npm run risk-check, then PR and merge on green CI", "owner": "orchestrator"}
  ]
}
```

## Checks run

- `npm test`: 1680 pass, 0 fail, 0 skipped (41 s).
- `npm run smoke:ui`: 10/10 PASS.
- Test diff against the specify commit f6f7797 for banquet-layout.test.mjs, scene-dressing-framing.test.mjs and scene-dressing-wiring.test.mjs: only the wiring edit above. Nothing removed or loosened. No change to horseshoe or grove tests since verify 2.
- Real render at 1440x900 and 375x667 with a fixture bridge and headless Chromium: chips whole, stones ring clear of signs and counters, no fog wash-out.

## Criterion map

1. Stone ring: banquet-layout.test.mjs ring tests; dressing.test.mjs builds it.
2. Pads, dashed, labelled: banquet-layout.test.mjs pad tests, scene-dressing-framing.test.mjs for position, dressing.test.mjs for fill plus dashes, pad-chip.test.mjs and the real render for the whole label.
3. No cover of sign or counter: scene-dressing-framing.test.mjs.
4. No biology word: banquet-layout.test.mjs and scene-dressing-wiring.test.mjs.
5. User verdict: human-verified.
6. Scope added, fog: grove.test.mjs "fog is grove-mist and starts beyond the market" with market-extent.fixture.mjs.

## Files outside the ticket's file list (listed, not judged)

All in `apps/ui/src/scene/`: grove.mjs, grove.test.mjs, market-extent.fixture.mjs, backdrop-dressing.test.mjs, dressing.mjs, dressing.test.mjs, pad-chip.mjs, pad-chip.test.mjs, handoffs.test.mjs, roam.test.mjs, horseshoe-layout.test.mjs, scene-dressing-*.test.mjs.
