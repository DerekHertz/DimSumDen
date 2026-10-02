# den-iso-v1/04: qa verify 2 (full verify of 6f04653)

Branch `feat/scene-dressing04` at `6f04653`, detached. Verdict: **QA bounce** (one real-render defect, one missing check). Tests and criteria are otherwise sound.

```json
{
  "ticket": "den-iso-v1/04-scene-dressing",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Reran npm test (1673/1673) and smoke:ui (10/10) on 6f04653, diffed tests against the specify commit f6f7797, rendered the real app at 1440x900 and 375x667. Bounce: the pad chips' text is clipped in the real render, and no check would catch a dressing that is not drawn.",
  "artifacts": [
    {"path": "/tmp/claude-1000/-home-dhertzell-dimsumden/42fefd50-55ba-48ef-826e-678b788978a4/scratchpad/qa-1440x900.png", "note": "real render at 1440x900 (canvas 1000 px wide)"},
    {"path": "/tmp/claude-1000/-home-dhertzell-dimsumden/42fefd50-55ba-48ef-826e-678b788978a4/scratchpad/qa-pads.png", "note": "2x crop of the Library and Drum pads"},
    {"path": "/tmp/claude-1000/-home-dhertzell-dimsumden/42fefd50-55ba-48ef-826e-678b788978a4/scratchpad/qa-375x667.png", "note": "real render at 375x667"}
  ],
  "decisions": [
    "Bounce on the clipped pad label: acceptance criterion 2 says the pads are labelled 'coming online'; on screen the text reads 'ibrary . coming onlin' and 'Drum . coming online' with its edge cut. The layout-level label test passes because the string is right; the canvas is what truncates it.",
    "Bounce on the missing rendered check: the Dressing self-render bug passed verify at ef7d73a because scene-dressing-wiring.test.mjs joins every .jsx file and greps for stepStones/DORMANT_PADS/bambooStalks, which the broken file contained too. The new backdrop-dressing.test.mjs pins the mount with source regexes, which fixes that one bug but still cannot see a dressing that builds nothing.",
    "Pad and bamboo visibility (the user's two points) is not bounced as a defect. Both are visible in the real render, but weak. Left to designer and the user's criterion 5 verdict, with the observations below.",
    "Fog scope item is covered and passes: market-extent.fixture.mjs takes the camera position from cameraConfig(view), covers default, ZOOM_MIN, ZOOM_MAX and all pan limits at 1440x900 and 375x667, and the test needs fog.near > the farthest market point (48.18, near 49). Not tautological. The real render shows no wash-out."
  ],
  "failures": [
    "apps/ui/src/scene/Den.jsx padChipTexture: PAD_CHIP_PX is 320x56 with 800-weight 26px text; 'Library . coming online' is wider than the canvas, so both ends clip (visible in qa-pads.png).",
    "No test or smoke check proves the dressing is drawn (stones, pads, bamboo present in the built group, and mounted)."
  ],
  "pending": [
    {"item": "Fix padChipTexture so the whole label fits (measureText and shrink the font or widen the canvas, then size the sprite from the real width), with a pure test on the sizing function", "owner": "developer"},
    {"item": "Add a node test that builds the dressing group (export buildDressing, pass literal tokens) and asserts 48 stones, 2 dashed pad groups, and the bamboo groups from bambooStalks(); keep the mount test", "owner": "developer"},
    {"item": "Ruling on pad and bamboo visibility at 1440x900: pad discs are partly hidden behind the grove mound and the 1.7-wide chip sits over the 1.3-wide disc; the dressing bamboo (darker) reads as part of the grove", "owner": "designer"},
    {"item": "Criterion 5: the user inspects the den in the browser and says it matches the frame", "owner": "user"}
  ]
}
```

## Checks run (steps 1 to 3)

- `npm test`: 1673 pass, 0 fail, 0 skipped (I ran it, 41 s).
- `npm run smoke:ui`: 10/10 PASS. It was not rerun after the fog change before; it is now. It does not look at the dressing.
- Test diff against the specify commit f6f7797 (`banquet-layout.test.mjs`, `scene-dressing-framing.test.mjs`, `scene-dressing-wiring.test.mjs`): no changes. Only `horseshoe-layout.test.mjs` (reviewed in verify 1, user ruling) and `grove.test.mjs` changed. In `grove.test.mjs`, `fog.near >= 16` became `fog.near > farthestMarketDistance()` plus `near < far`: stricter, and it is the user's scope change. `backdrop-dressing.test.mjs` and `market-extent.fixture.mjs` are new.

## Criterion map (unchanged from verify 1, all passing)

1. Stone ring: banquet-layout.test.mjs ring tests.
2. Pads, dashed, labelled: banquet-layout.test.mjs pad tests; framing test for position. The rendered label is clipped (finding 1).
3. No cover of sign or counter: scene-dressing-framing.test.mjs.
4. No biology word: banquet-layout.test.mjs and scene-dressing-wiring.test.mjs.
5. User verdict: human-verified.
6. Scope added, fog: grove.test.mjs "fog is grove-mist and starts beyond the market".

## Findings

- `apps/ui/src/scene/Den.jsx:214` (PAD_CHIP_PX) and `:217-242` (padChipTexture): label text wider than the 320 px canvas, clipped at both ends. Seen at 1440x900 and 375x667.
- `apps/ui/src/scene/backdrop-dressing.test.mjs:15-24` and `scene-dressing-wiring.test.mjs:13-17`: both read source text. Nothing builds the group or draws it, so an empty or unmounted dressing still passes.

## Observations for the designer and user (not bounced)

At 1440x900, canvas 1000 px wide:
- Stone ring: clear, reads as a ring around the front and sides, nothing covers a counter or sign.
- Fog: gone from the market and Bao. Far grove is lightly misted. Matches the scope item.
- Pads: dashes are faint, and the inner part of each disc sits under the grove mound. The chip (1.7 wide) is wider than the disc (1.3), so it covers most of it. In the smoke-style fixture (3 chips) the Steamers chips do not overlap the pad chips; I did not try the 13-cell fixture the developer used.
- Bamboo: left and right clusters are the darker, thicker stalks and stand out from the pale far grove, but they merge with the near layer.
- 375x667: only the Library pad is in frame; the Drum pad and the right bamboo are off screen. The framing test only requires the right cluster inside the viewport.

## Worktree and scope

Files changed on the branch vs d292137, all in `apps/ui/src/scene/`: Backdrop.jsx, Den.jsx, grove.mjs and the tests above. The ticket lists Den.jsx, Backdrop.jsx, banquet-layout.mjs and banquet-layout.test.mjs. Outside the list: `grove.mjs`, `grove.test.mjs`, `market-extent.fixture.mjs`, `backdrop-dressing.test.mjs` (fog scope and the Dressing fix), and `handoffs.test.mjs`, `roam.test.mjs`, `horseshoe-layout.test.mjs`, `scene-dressing-*.test.mjs` (stations moving to x +-3.0). I list them without judging them.
