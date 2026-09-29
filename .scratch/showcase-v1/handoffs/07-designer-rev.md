# 07 designer spec revision: stele beside the Cubs basket

## State
```json
{"ticket": "showcase-v1/07-tally-stele", "cell": "designer", "mode": "spec", "branch": "showcase-v1/07-tally-stele", "base": "462bab8", "status": "ready-for-agent", "next": "qa specify"}
```
- mode: spec (revision)
- ticket: showcase-v1/07-tally-stele
- base: 462bab8 (branch showcase-v1/07-tally-stele); no code changed by designer
- supersedes: placement and size in handoffs/07-designer.md (mound, x 2.3 z -6.0). Stone look, colours, face, name, label, click/Enter unchanged.
- next: qa (specify) rewrites tally-stele.test.mjs per the list below; developer moves TALLY and adds the roam obstacle.

## Why
User browser check of 462bab8: on the mound the stele floats and reads too small (tablet 1.0 tall at depth 17.5 = 0.057 screen units). Moving it to the front floor next to the Cubs basket grounds it and makes it about 2.8x taller on screen.

## Placement (banquet-layout.mjs, export TALLY, name kept)
- x 1.5, z 3.4 (same depth as CUB_BASKET (0, 3.4), to its right, the side Tally sat on before)
- groundY 0: the plinth sits flat on the floor, bottom at y -0.02 (a hair sunk so no gap shows). No mound maths; remove MOUND_Q.
- rotationY -0.183 rad (= -atan2(1.5, 8.1)): the face turns toward the default camera.
- gap to basket: plinth left edge 0.95 minus basket radius 0.55 = 0.40 clear floor.

## Size (larger)
- plinth: width 1.1, height 0.25, depth 0.4
- tablet: width 0.9, height 1.3, depth 0.14, standing on the plinth top
- top of tablet: y 1.53 (about 1.55)

## Clearances from the default camera (x 0, y 4.2, z 11.5), hand-worked
- Table (right edge x 1.3, z 0): stele left 0.95 projects to 1.35 at z 0 -> clear, just; tablet left 1.05 -> 1.49.
- Bao (right edge 1.4 at z -2.4): plinth left projects to 1.63 -> clear by 0.23.
- Everything behind: tablet top screen y (1.55-4.2)/8.1 = -0.327, below Bao's feet (-0.302) and the table top (-0.304), so the stele covers only floor behind it.
- Pantry stall inner edge 2.875 at z 2.2: stele right 2.05 projects to 2.35 -> clear. Front of House inner edge 3.675 at z -1.6: 2.05 -> 3.32 -> clear.
- Architect perch (screen y -0.16) and all Pass perches sit far above the stele top: clear.
- Cub row (z 4.6) stands in front; its plush tops (about y 0.8) project to -0.493, below the tablet bottom (-0.488), so cubs never cover the face, and the stele never covers a cub.
- Cubs label pill at (0, 0.65, 3.4) stays left of the plinth (x 0.95).

## Label and interaction
- Tally pill: above the tablet, at (1.5, 1.8, 3.4). Text "Tally", aria "Tally: open the dashboard", click/Enter opens the dashboard, unchanged.

## Roaming
- Add the stele footprint to roamObstacles: rect x 0.85..2.15, z 3.1..3.7 (plinth plus 0.1). The old (-3.0, 0.3) obstacle stays gone.

## Tokens and states (unchanged)
- --stone #4a4d4a tablet, --stone-deep #3d403d plinth, both themes; charts as --qi #3aced3 lines on meshBasicMaterial; "spills" stays.
- Reduced motion: no motion on the stele. Design system Stele entry: update "on the mound" to "beside the Cubs basket" at review.

## qa tests to change (apps/ui/src/scene/tally-stele.test.mjs)
- header comment: mound -> beside the Cubs basket.
- L27 grove mound numbers: delete (no longer relied on).
- L32 position: x 1.5, z 3.4, groundY 0, rotationY about -0.183 (eps 0.01).
- L38 size: plinth 1.1 x 0.25 x 0.4, tablet 0.9 x 1.3 x 0.14; top between 1.4 and 1.7; keep no-roof and no faceBottom asserts; drop "smaller than 1.6".
- L49 footprint on mound: replace with "grounded beside the basket": groundY 0, same z as CUB_BASKET, plinth left edge minus CUB_BASKET_RADIUS >= 0.3, and the plinth front (3.6) stays behind the cub row (4.6 - 0.35).
- L59 "farther than everything": replace with "covers only floor": tablet top screen y below the projected y of Bao's feet and the table top; stele screen x range clear of the table's and Bao's projected right edges and the Pantry and Front of House inner edges.
- L70 Bao right edge: keep the idea, recompute (plinth left projects >= 1.5 at Bao's depth).
- L81 near bamboo: delete (moot).
- L87 perch overlap: keep, now passes; add pantry#0..2 and cub row slots 0..7.
- L104 roam: keep; add that (1.5, 3.4) is covered.
- L112, L122 face and name: unchanged.
- Developer's test-8 contradiction (architect perch) is resolved by the move.
