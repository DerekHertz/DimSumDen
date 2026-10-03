```json
{
  "ticket": "den-scene-v1/11-bigger-cuter-bao",
  "cell": "designer",
  "mode": "spec",
  "current_step": "Amendment 1 settles the three spec conflicts qa specify found; it is in this file (the board refuses to overwrite 11-designer-spec.md, published under the earlier claim). Read 11-designer-spec.md plus this file; this file wins where they differ. qa specify can continue on feat/11-bigger-cuter-bao",
  "artifacts": [
    ".scratch/den-scene-v1/handoffs/11-designer-spec-2.md (Amendment 1 below)"],
  "decisions": [
    "Conflict 1 (Tea sign inside the Steamers kiosk at 1440x900, also at 375): keep the back kiosks at +-3.6 and move Tea and Pantry from x +-4.9 to +-5.2 (z 2.0). Sign margins become 15 px at 1440 and 5 px at 375; the front kiosks end 2 px inside the 375 edge (cost, flagged). Moving the Steamers kiosk back to -3.4 instead would overlap Bao by 0.13",
    "Conflict 2 (pads): pad z -7.2 becomes -7.65, x stays +-3.4. Ring distance 1.096 (band 0.85 to 1.15), nearest stone 1.134 (needs 0.82). qa's 0.70 was the value at z -8.1, the spec's earlier idea; at -7.2 the pads would be 1.49 in. Pill gap to the shoulder pandas is z-independent: 52.8 px (1440) and 17.3 px (375)",
    "Conflict 3 (grove): test replaced by T8: far, mid and near stalks at least 0.3 outside Bao's footprint box for seeds 1, 3, 5, 7, 11 (measured min 0.703); the behind-the-back rule is dropped for tufts and leaves; no grove source change",
    "Under the final constants 33 scene tests fail beyond a baseline of 19 that also fail on a clean tree (mounted-UI tests, an environment matter); the list is in Amendment 1 section A4"],
  "failures": [
    "Bash with a heredoc and a leading cd refused by the worktree guard as too complex; wrote the probe with the Write tool and ran node <path>",
    "Write refused once on an existing empty file left by that failed heredoc ('File has not been read yet'); removed it and wrote again"],
  "pending": [
    {"item": "qa specify: continue on the branch with the amended spec (A1 constants and assertions, A2 pad z and bamboo clearance assertion, A3 T8, A4 ripple list); the developer then sets Tea and Pantry x +-5.2 and pad z -7.65 in banquet-layout.mjs", "owner": "qa"},
    {"item": "orchestrator: flag to the user that the front kiosks sit 2 px inside the 375 edge and the pad z moved; the review (R3, R8) checks both", "owner": "orchestrator"}]
}
```

## State

Spec amended; ticket released at its current status after this handoff. Nothing under `apps/` changed (every probe was a scratch edit reverted with git checkout; the worktree is clean). Numbers come from running `worldToScreen`, `stepStones` and `groveLayout` against the scratch constants.

## What changed

- New constants: `STALLS` tea x -5.2, pantry x 5.2; `DORMANT_PADS` z -7.65 (x +-3.4 as before).
- Replaced test: grove "everything stands behind Bao's back" becomes T8 (stalks only, 0.3 clear of the footprint box, five seeds).
- New assertions: sign anchors at least 4 px outside other kiosks at both sizes, front kiosks at least 1 px inside the viewport, pads at least 0.1 from every bamboo stalk.
- Changed literals: horseshoe targets, Steamers and Tea and Pantry x tests, pad coordinates, pan x-limit (the widest stall edge moved 0.3), and every screen literal, recomputed by running the modules.
- New review item R8 (tufts and leaves against Bao's skin); R3 also checks the 375 edge.

## Amendment 1 (designer, after qa specify): settles the three conflicts

This section wins over sections 1, 2 and 7 where they differ. Everything below was measured by applying the constants in a scratch edit of `banquet-layout.mjs` and `iso-projection.mjs` and running the existing tests and `worldToScreen` (source reverted; nothing committed).

### A1. Conflict 1: the Tea sign sits inside the Steamers kiosk. New constants: Tea and Pantry x +-4.9 become +-5.2

Cause. Bao at 2.1 forces the back kiosks to x +-3.6 (T3 needs a 0.05 gap to his box). The default-framing check tests the sign anchor against the other kiosks' screen bounding rectangles. At 1440x900 the Tea sign anchor is (290, 546) and the Steamers kiosk rectangle at x -3.6 is x 278..529, y 329..605, so the anchor is 12 px inside (the same for Pantry against Front of House). At x -3.0 the rectangle began at x 331 (41 px clear), which is why it passed before. At 375 the margin is about -4 px.

Why not move the kiosk back. A Steamers kiosk at x -3.4 clears the sign by 6 px but overlaps Bao's box by 0.13 world. A sign cannot move off the kiosk, and the camera lever (`TARGET` x) moves both together. The one free lever is the front kiosks.

New constants (`STALLS`, `z` stays 2.0): `tea` x -5.2 and `pantry` x 5.2. This is a +0.3 outward move, the same size as the back kiosks' move. Measured at the default frame with kiosks +-3.6 and front kiosks +-5.2:

| | 1440x900 | 375x667 |
|---|---|---|
| Tea sign anchor to Steamers kiosk rect (px outside; Pantry to Front of House the same) | 15 | 5 |
| Tea kiosk x extent (Pantry mirrors) | 156..377 | 2..75 |
| Pantry kiosk x extent | 1063..1284 | 300..373 |
| Every other sign to kiosk margin | at least 30 | at least 30 |

At 375 the front kiosks end 2 px inside the viewport edge (about 11 px before). The existing "inside the viewport" test still passes. Raising the mobile divisor (13.0) would buy the margin back but rescales every 375 literal; do not do it. Review item R3 looks at the 375 edge.

Test changes (the existing default-framing tests stay as written and pass; this replaces the spec's claim in section 2 item 1 that they pass with no other change):
- `default-framing.test.mjs`, new assertions: at both sizes every sign anchor is at least 4 px outside every other kiosk's rectangle (measured minimum 15 and 5), and the Tea and Pantry kiosk rectangles are at least 1 px inside the viewport (measured 2).
- `horseshoe-layout.test.mjs`: approved targets steamers x -3.6, front-of-house x 3.6, tea x -5.2, pantry x 5.2 (tolerance 0.3 stays; the tea literal must be the new one, because 5.2 against 4.9 is exactly the tolerance); the station-labels test follows.
- `banquet-layout.test.mjs`: the Steamers and Front of House "+-3.0" test becomes +-3.6 and now says Tea and Pantry move to +-5.2; the table, Cubs, Tally and z of every stall stay. Stall-anchor, overflow and Steamers five-cell literals: shift Steamers by 0.6 (qa did) and Tea and Pantry by 0.3 outward.
- `iso-projection.test.mjs` and `camera-rig.test.mjs`: `WIDEST_STALL_EDGE` is now 0.3 larger (Tea and Pantry set it), so the pan x-limit literals change as well as the `TARGET` ones. Recompute by running the module.

### A2. Conflict 2: the pads. New constants: pad z -7.2 becomes -7.65 (x +-3.4 stays)

Cause. The section 1 table moved the ring but not the pads' z. My "move back about 0.9" idea was the ring's shift; the pad x also moved outward 0.5, and the distance to the ring depends on both. Measured distance from the pad centre to the ring ellipse (centre (0, -3.3), semi-axes 7.3 and 6.3) with pad x +-3.4:

| pad z | in from the ring | nearest stone centre |
|---|---|---|
| -7.2 | 1.486 (too deep, band is 0.85 to 1.15) | 1.515 |
| -7.65 | 1.096 | 1.134 (42 stones survive) |
| -8.1 | 0.698 (qa's 0.70; too shallow, stones touch) | 0.702 |

Pick -7.65: 1.096 in, so the "about 1.0" band (0.85 to 1.15) and the pad-touches-stone rule (0.65 + 0.17 = 0.82 to every stone) both hold. No change to the test band or to the ring.

Knock-on numbers at pad z -7.65:
- Pill versus shoulder panda gap does not depend on z (screen x is `W/2 + k (x - tx)`): 52.8 px at 1440x900 and 17.3 px at 375x667 on both sides; at least 8 px holds (T5).
- Pill centre y on screen: 220 px (1440x900), 265 px (375x667): inside the viewport.
- The back-left bamboo cluster is at (-3.4, -8.5), so its middle stalk is 0.85 behind the Library pad centre: 0.135 world clear of the 0.65 disc (stalk 0.13 wide). New assertion in `banquet-layout.test.mjs`: every pad disc is at least 0.1 world from every bamboo stalk (measured 0.135 left, 0.33 right). If a render shows the dashed ring touching the stalk, move the back-left cluster back 0.3 (z -8.8); not the pad.
- Existing tests that change: "Library and Drum ... at (-2.9, -7.2) and (2.9, -7.2)" becomes (-3.4, -7.65) and (3.4, -7.65). Pad pixel literals in `scene-dressing-framing.test.mjs` (the pads test and the kiosk-centres test) come from running the module.

### A3. Conflict 3: the grove "behind Bao's back" test is replaced by T8

`grove-layout.test.mjs` "everything stands behind Bao's back and clear of the stalls" is replaced by two assertions. It is the only grove test that fails (the mound tests and "centre behind Bao" pass unchanged):
1. For seeds 1, 3, 5, 7 and 11, every far, mid and near stalk is at least 0.3 world outside Bao's footprint box (`|x| <= BAO.scale`, `z` from `BAO.position[2] - 0.875 BAO.scale` to `+ 0.875 BAO.scale`, so z -5.1375 to -1.4625). Measured minimum clearance by seed: 0.967, 0.968, 0.703, 0.810, 0.758.
2. Every `STALL_CENTERS` z is greater than Bao's back plane (-5.1375); kept from the old test.

Dropped: `z < baoBack` for tufts and leaves. 16 to 18 stalks and about 50 leaves have z in front of the back plane because they stand beside him (|x| > 2.1); and ground tufts of seeds 1, 5 and 11 stand inside the footprint (clearance 0.000), under or behind his body. The grove layout is unchanged (the user picked B as rendered), so no source edit. New review item R8: no tuft or leaf pokes through Bao's skin or hangs in front of his feet at the default seed.

### A4. Tests that fail under the final constants (for qa; 33 beyond a baseline of 19)

Run with BAO [0, 2.1, -3.3] scale 2.1, back kiosks +-3.6, Tea and Pantry +-5.2, pads (+-3.4, -7.65), `TARGET` [0, 0, -2.9] in `apps/ui/src/scene/*.test.mjs`: 452 pass, 52 fail. 19 of the 52 fail on a clean tree too (the mounted-UI tests: "mounted stall trim ... theme changes" and the Tally card criteria 1 to 9) and are an environment matter, not this change. The 33 that this change breaks, by file: banquet-layout (Pass perches x2, stalls, Steamers share slots, three-slot anchors, overflow x2, landmarks, Steamers +-3.0, ring x3, pads x2), camera-store and camera-rig (keyPan, pan clamps, starts at Level 1, goToLevel, subscribers), grove-layout (the one above), handoffs (stationBearing, service bell on the crown), horseshoe-layout (steamers, front-of-house, labels), iso-projection (pitch, digest pixel table, ground pick, cameraConfig, three camera, pan x-limit), scene-dressing-framing (pads, kiosk centres). The `roam` tests do not fail on constants alone; they change with the `roamObstacles` source edit.

### A5. Edits to earlier sections

- Section 1 table: add rows "Tea and Pantry x -4.9, +4.9 -> -5.2, +5.2" and change the pad row to "(+-2.9, -7.2) -> (+-3.4, -7.65)".
- Section 2 item 1: replace "pass with the new constants" with "pass with the new constants, including Tea and Pantry at +-5.2, plus the A1 assertions".
- Section 7: T4 reads "existing tests plus the A1 sign and edge assertions"; T5 and the pad tests use z -7.65; T8 is A3.
- Section 8: add R8 (A3); R3 also checks the Tea and Pantry kiosks against the 375 edge.
