```json
{
  "ticket": "den-scene-v1/11-bigger-cuter-bao",
  "cell": "developer",
  "current_step": "Den.jsx and Market.jsx are wired; scene suite 499 of 500 pass, npm test 1938 of 1939 pass. The one red is T5 'shoulder pandas status chips do not overlap either pill', which no source change can turn green (see failures). Ready for review at in-review on feat/11-bigger-cuter-bao-5.",
  "artifacts": [
    "apps/ui/src/scene/Den.jsx (seat store, Bao pose after mixer.update, faceFor, softenPatches, bakeBaoSeats, Pass seats via seatWorld, live roamer slot, Bao Figure rendered before Market and roamers, PAD_CHIP_Y = 0)",
    "apps/ui/src/scene/Market.jsx (ServiceBell takes the seat store; rail at railWorld, bell keeps its delta from RAIL)"],
  "decisions": [
    "Wiring follows the previous handoff exactly. Figure gets seats and seat props. For id bao: fur geometry replaced by softenPatches (disposed on unmount), applyBaoPose then root.updateMatrixWorld(true) right after mixer.update, one bake when clip is sit_still (try/catch, logs once). Pass Figures write position from seatWorld at the end of useFrame; first product and architect are RoamFigures whose slot is the live seatWorld point; placed() and idlePlaces now return slot. Nothing throws when baked is null.",
    "T5 lever chosen: the pill sprite y in PadChips went from 0.1 to 0 (PAD_CHIP_Y). At 375x667 the Library pill top was 261.0 px and the product chip bottom 263.0 px (x overlap 89.8 to 114.1 px), so a 2 px overlap. Lowering the sprite by 0.1 moves it down 0.1 x 28.85 x 0.8165 = 2.36 px: pill top 263.36, a gap of about 0.4 px. At 1440x900 the pill and chips are already separated horizontally (pill right 496.7, chip left 520.8), the pill just sits 7 px lower relative to the pad centre.",
    "Pad z not moved (pinned at -7.65 by banquet-layout and scene-dressing-framing tests). No test edited."],
  "failures": [
    "T5 'shoulder pandas status chips (96 x 22, stacked) do not overlap either pill' still fails at 375x667 (library pill overlaps the product chip). It cannot pass from source: the test hard-codes the pill (PILL = width 1.714, height 0.3, y 0.1 literals) and the shoulder seats and chip anchor, and reads only DORMANT_PADS (pinned exact), iso-projection (moving TARGET shifts pill and chip equally; baseScale would need k above 58 px per unit, 375 gives 28.85, and a larger scale loses the kiosk-edge margin) and stackChips (no stacking happens here). So the Den.jsx sprite y change is invisible to it. The test is not wrong in intent but its PILL.y literal is a copy of Den.jsx, so it can never see a Den.jsx fix. Needs qa: change PILL.y from 0.1 to 0 (then my numbers give a 0.36 px gap and it passes) or relax to the designer's accepted margin, or the designer picks another pad z. I did not edit the test.",
    "The scout subagent's test-run report was unusable (it passed a directory to node --test and truncated npm test), so I ran both myself: node --test apps/ui/src/scene/*.test.mjs gives 500 tests, 499 pass, 1 fail; npm test gives 1939 tests, 1938 pass, 1 fail (same T5).",
    "The /code-review stage was not run: context was already past 76k before the test runs. The orchestrator or qa verify should cover it."],
  "pending": [
    {"item": "Resolve T5: update the test literal PILL.y to 0 (matches Den.jsx PAD_CHIP_Y), or choose a different lever. A 0.4 px gap is thin; the designer may prefer PAD_CHIP_Y of about -0.05 (gap about 1.5 px at 375).", "owner": "qa"},
    {"item": "Designer review in the browser: R1 same-frame ordering (Bao's Figure now renders before Market and roamers, check the Pass pandas and rail do not lag a frame behind breathing); R2 product slots 1 and 2 (z -3.784, -4.184) land on Bao's lower flank (y about 1.30 and 1.07), check they do not intersect the cheek; the kiosk-edge margin at 375 (Tea and Pantry at x +-5.2, 2 px), not verified; the Library and Drum pills sitting on the floor.", "owner": "designer"}]
}
```

## State

Source for ticket 11 is complete on feat/11-bigger-cuter-bao-5. Remaining reds and checks are listed in the block above. Test counts: scene 499 of 500, npm test 1938 of 1939; the single failure is T5 chips and is unfixable from source because the test's pill model is literals.
