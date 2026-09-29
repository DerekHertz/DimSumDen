# 07: Tally as a stone stele on the mound

**Type:** feature

**Priority:** P1

**What to build:** Replace the pagoda slate with a stone stele: an upright engraved stone tablet on a low stone base, no roof or posts. Place it on the leafy mound behind Bao, to his right, raised up the slope and smaller than today, so no stall, cell, label, Bao or the table sits behind it from the default camera. The three charts show on its face as glowing qi-teal lines, like carved characters catching light; "spills" stays. Click or Enter still opens the dashboard in the panel without scrolling the page; the label pill stays "Tally".

**Blocked by:** None

**Status:** in-review

- [ ] Stele geometry and placement in the layout module, with a unit test that its footprint is on the mound and nothing in the market is occluded by it from the default camera
- [ ] Face renders the three charts in qi teal on stone; accessible name unchanged
- [ ] smoke:ui passes; the user checks it in a browser

## Comments
- **Decision (user, 2026-09-29):** Tally clutters the scene as a pagoda slate; make it a stone stele on the mound behind Bao, right side.
- **designer, 2026-09-29:** UI spec (designer): stele at x 2.3, z -6.0 on mound (groundY from mound ellipse ~1.25), tablet 0.7x1.0x0.12 on plinth 0.9x0.2x0.35; stone #4a4d4a both themes; charts as dark --qi #3aced3 glowing strokes; name, pill, click/Enter unchanged; occlusion test = projected left edge right of Bao + footprint inside mound. Full spec: handoffs/07-designer.md
- **Decision (user, 2026-09-29):** approved adding `--stone` and `--stone-deep` tokens and a Stele component entry to the design system; designer publishes it in review mode.
- **developer, 2026-09-29:** developer: tally-stele test 8 (no overlap with architect perch) contradicts pinned x/z/size; architect#0 perch projects inside the stele box. Not editing tests; qa to fix. Details in handoff 07-developer.
- **developer, 2026-09-29:** qa test 8 contradicts spec; all else green
- **Decision (user, 2026-09-29, browser check of 462bab8):** stele on the mound looks floating and too small. Move it next to the Cubs basket. Supersedes the mound placement; test 8 (architect perch overlap) moot once moved.
- **designer, 2026-09-29:** Spec revision (designer): stele moves to floor beside Cubs basket at x 1.5, z 3.4, groundY 0, yaw -0.183; plinth 1.1x0.25x0.4, tablet 0.9x1.3x0.14; pill at y 1.8; roam obstacle x 0.85..2.15 z 3.1..3.7. Clears table, Bao, stalls, perches, cub row. Look, name, label, click/Enter unchanged. qa test changes listed in handoffs/07-designer-rev.md
- **Browser check (user, 2026-09-29, 0dba375):** stele beside the Cubs basket looks right; approved as long as click opens it.
