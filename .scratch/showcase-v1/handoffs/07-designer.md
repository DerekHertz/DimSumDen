# 07 designer handoff: tally stele UI spec

```json
{"ticket": "showcase-v1/07-tally-stele", "cell": "designer", "mode": "spec", "current_step": "UI spec written; ready for qa specify",
 "artifacts": [".scratch/showcase-v1/handoffs/07-designer.md"],
 "decisions": ["stele at x 2.3, z -6.0 on the mound, groundY from the mound ellipse", "stone same colour in both themes; lines in dark-theme --qi #3aced3", "keep export name TALLY"],
 "failures": ["no browser check in spec mode"],
 "pending": [{"item": "roam.mjs roamObstacles includes Tally: its obstacle must move with the stele (or drop, since it is on the mound off the grass)", "owner": "developer"}, {"item": "approve --stone / --stone-deep tokens", "owner": "user"}]}
```

## State
- mode: spec
- ticket: showcase-v1/07-tally-stele
- base: main at de9451b (worktree detached, no commits)
- status: spec written; ticket left at ready-for-agent for qa specify
- next: qa --mode specify turns the spec below into tests

## UI spec

### Geometry (banquet-layout.mjs, replaces TALLY)
The mound (grove-layout.mjs) is an ellipsoid: centre (0, 0, -6.0), radii x 3.2, y 1.8, z 1.6 (scale z = radius*0.5). Surface height `h(x,z) = 1.8*sqrt(1 - (x/3.2)^2 - ((z+6)/1.6)^2)`.

Export `TALLY` (keep the name so imports survive) as a stele:
- `x: 2.3, z: -6.0` (right of Bao from the camera, on the mound's crest line)
- `groundY: moundHeight(2.3, -6.0)` ~= 1.25, computed from the mound numbers, not typed in. Export the mound constant from one place so grove and layout share it.
- base plinth: width 0.9, height 0.2, depth 0.35, sunk 0.1 into the mound (bottom at groundY - 0.1)
- tablet: width 0.7, height 1.0, depth 0.12, bottom on the plinth top; top edge gently rounded or bevelled (no roof, no posts)
- face: the tablet's front (+z) side, inset 0.06 on each side; canvas aspect stays about 16:9 rotated to fit, or change FACE_PX to 320x448 portrait with charts stacked vertically
- tilt: none; faces +z (the camera)

### Occlusion test (unit, pure math)
From the default camera (0, BASE_Y 4.2, BASE_Z 11.5), project the stele's bounding box. Assert:
1. footprint (plinth corners) lies inside the mound ellipse at that height (h > 0 at all four corners)
2. the stele's box does not overlap, in screen x/y, any of: Bao's box (BAO, BAO_BOX), the table, any stall box, any cell perch position and the label anchor points ChipLayer uses, where that thing is farther from the camera than the stele. Since the stele is behind everything (z -6.0 vs Bao -2.4), the real check is: nothing is behind it. Also assert the stele's left edge projected to Bao's depth is right of Bao's right edge (margin >= 0.1): at x 2.3 it is about 1.55 vs 1.4.
3. near bamboo (minX 2.8, z -5.2..-4) does not cover the face: stele right edge projects to < 2.6 at z -4.6.

### Look
- stone: a mid-dark warm grey, about #4a4d4a tablet, #3d403d plinth, flatShading, roughness 0.9. No token exists; see Proposed design-system change. Same colour in both themes (it is a lit 3D object; the grove tokens already retint the scene around it).
- lines: the three charts and the "spills" label drawn as thin strokes (2-3 px at canvas scale) in the dark-theme value of `--qi` (#3aced3), on the stone colour, with a 1-2 px lighter halo (`--qi` at 40% alpha, blur 4) so they read as carved characters catching light. Contrast #3aced3 on #4a4d4a is about 3.9:1: graphics pass 3:1 (WCAG 1.4.11). Chart titles in `--rice-paper`-ish off-white (#f2efe4, the current CHALK), 18px+, >= 4.5:1 on the stone.
- title: "Tally" in `--font-display` (Long Cang), carved look, CHALK colour; no frame stroke, or a thin inset border in stone-lighter.
- material: use meshBasicMaterial (or emissive map) for the face so the lines glow regardless of scene lighting; stone body stays meshStandardMaterial.
- scale: tablet about 60% of the old slate width (1.6 -> 0.7 wide). Top edge about y 2.45, below the grove's near leaves.

### States
- empty metrics: each chart shows its existing empty text in CHALK dim; no teal lines.
- loading: same as empty (face static until metrics arrive).
- error: unchanged from today's tally-face view-model.
- reduced motion: the stele is static in all modes. An optional slow glow pulse (dur-breath) on the lines runs only when prefers-reduced-motion is off; with it on, the glow is constant.
- light and dark themes: stele colours identical in both; only the surrounding grove tokens change. Label chip "Tally" follows its themed pill tokens as today.

### Interactions and copy
- click on tablet or plinth opens the Dashboard in the panel, page does not scroll (unchanged).
- hover: cursor pointer; lines brighten (halo alpha 40% -> 70%) when motion is allowed.
- keyboard: the ChipLayer "Tally" pill stays the route; Enter opens the dashboard; focus ring `--focus-ring`. Its anchor moves to the stele top centre (x 2.3, y ~2.55, z -6.0).
- copy: pill label "Tally"; face title "Tally"; chart titles unchanged; "spills" unchanged.

### Accessibility
- accessible name of the Tally control unchanged (qa: assert the exact current string).
- pill is focusable, visible focus ring, Enter and Space both open (if Space works today).
- face text contrast as above; nothing conveyed by colour alone (charts keep labels).

## Proposed design-system change (not published; needs user approval)
Add `--stone` (#4a4d4a) and `--stone-deep` (#3d403d) as scene tokens beside the grove tokens, and a "Stele" component entry (tablet + plinth, qi-teal carved lines). Until approved, the developer keeps them as named constants in TallyFace.jsx.

## Not done
- No browser check (spec mode; cloud Chromium cannot run pinned Playwright).
- Mockup canvas and design-system artifacts not read this session (token list taken from apps/ui/src/styles.css).
