# den-iso-v1/04: qa verify handoff

Branch `feat/scene-dressing04`, commit `ef7d73a`. Light verify on developer's work from 04-developer and 04-developer-2.

```json
{
  "ticket": "den-iso-v1/04-scene-dressing",
  "cell": "qa",
  "mode": "verify",
  "current_step": "All tests pass (1671/1671, smoke:ui 10/10); horseshoe test change reviewed and verified correct per user ruling. Ready for merge or next stage.",
  "artifacts": [
    {"path": "apps/ui/src/scene/horseshoe-layout.test.mjs", "note": "table-vs-counter check changed to separating-axis test on true screen outlines per user ruling; counter-vs-Bao and counter-vs-counter remain strict bounding-rect"}
  ],
  "decisions": [
    "Horseshoe test correctly implements user ruling: depth-aware via outline comparison, tabletop radius 1.8 kept, +-3.0 move kept, all other checks strict",
    "Test is not vacuous: developer verified counter at x -2.0 z -1.0 fails, at real +-3.0 passes",
    "All acceptance criteria mapped to passing tests; criterion 5 (user visual verdict) remains human-verified"
  ],
  "failures": [],
  "pending": [
    {"item": "Criterion 5: user inspects the den in the browser and confirms it matches the frame (human-verified, ready-for-human)", "owner": "user"}
  ]
}
```

## Test verification

- `npm test`: 1671 of 1671 pass, 0 fail, 0 skipped
- `npm run smoke:ui`: 10 tests pass, all PASS (load, font, scene rendering, queue priority, chart rendering, approval flow, camera fit, camera zoom, camera pan)
- `git diff f6f7797 ef7d73a -- apps/ui/src/scene/banquet-layout.test.mjs`: no changes (zero removals, zero assertion loosens)

## Horseshoe test change review

The developer's second commit changed `apps/ui/src/scene/horseshoe-layout.test.mjs` line 52-87 (the "default-camera counter rectangles clear kiosks, Bao and table" test) per the user's ruling: "make the table-vs-counter check depth-aware, keep tabletop radius 1.8 and the +-3.0 move, keep everything else strict".

**Implementation verified:**
- Counter-vs-Bao check: still strict bounding-rect (`overlaps(rect, bao)`, line 79)
- Counter-vs-counter check: still strict bounding-rect (`overlaps(rect, counters[j].rect)`, line 87)
- Table-vs-counter check (lines 80-86):
  - Now uses `polygonsOverlap(shape, table.shape)`: a separating-axis test on the true screen outlines (counter slab and table disc)
  - Tabletop radius: still 1.8 (line 74 in test)
  - Station x positions: still +-3.0 (line 12 in test: targets)
  - Depth is used only for the failure message ("which is in front"), not to skip the check
  - The true outlines are checked, not just bounding rects or depth alone
  - Not vacuous: developer confirmed with scratch script that counter moved to x -2.0 z -1.0 fails; at real +-3.0 it passes

## Criterion-to-test map (from qa specify)

| Criterion | Test |
|---|---|
| Stone ring placed with digest count and radius around Bao | banquet-layout.test.mjs: "the stone ring: 48 stones...", "every placed stone...", "the ring keeps at least 36..." |
| Pads at digest positions, dashed, labelled "coming online" | banquet-layout.test.mjs: "Library and Drum are dashed dormant pads...", "each pad is labelled..."; scene-dressing-framing.test.mjs: "the pads sit behind Bao's shoulders..." |
| No stone, pad or bamboo covers kiosk sign or counter at default frame | scene-dressing-framing.test.mjs: "...covers a kiosk counter...", "...covers a kiosk sign anchor..." (both sizes) |
| Pads carry no biology word | banquet-layout.test.mjs: "the pads carry no biology word..."; scene-dressing-wiring.test.mjs: "no aria-label literal...holds a biology word" |
| Bamboo (three clusters) | banquet-layout.test.mjs: two bamboo tests; scene-dressing-framing.test.mjs: "the right-edge bamboo cluster stays inside the viewport" |
| All placed by layout module | scene-dressing-wiring.test.mjs: "the scene draws the stone ring, the pads and the bamboo...", "world numbers are not copied" |
| Pandas never stand on grass | banquet-layout.test.mjs: "no cell perch lands on a dormant pad or in a bamboo cluster" |
| Steamers and Front of House move to +-3.0 | banquet-layout.test.mjs: "Steamers and Front of House stand at x +-3.0..." |
| User visual verdict | **human-verified** (criterion 5) |

## Files outside ticket scope

- `apps/ui/src/scene/horseshoe-layout.test.mjs` — modified per user ruling. This is a test file outside the ticket's scope but was required to apply the ruling on the table-vs-counter check.
