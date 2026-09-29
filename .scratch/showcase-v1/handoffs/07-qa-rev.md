# 07 qa specify (revision): stele beside the Cubs basket

## State
```json
{"ticket": "showcase-v1/07-tally-stele", "cell": "qa", "mode": "specify", "branch": "showcase-v1/07-tally-stele", "specify_sha": "418020e", "next": "developer"}
```
- Branch showcase-v1/07-tally-stele, pushed at 418020e (on top of 462bab8). Only apps/ui/src/scene/tally-stele.test.mjs changed.
- Red run: 10 tests, 3 pass, 7 fail, all for missing feature (values, not setup errors).

## Criterion to test map
1. Position x 1.5, z 3.4, groundY 0, rotationY about -0.183: test 1 (fails: x is 2.3)
2. Size plinth 1.1x0.25x0.4, tablet 0.9x1.3x0.14, top 1.4..1.7, no roof: test 2 (fails: old size)
3. Grounded beside basket, same z, gap >= 0.3, behind cub row: test 3 (fails: groundY)
4. Covers only floor and sideways clearance (table, Bao, Pantry, FoH): test 4 (fails: top vs Bao feet)
5. Plinth left projects >= 1.5 at Bao's depth: test 5 (fails: 1.47 now)
6. Cubs do not cover face: test 6 (passes already, independent of x; guards regressions)
7. No perch overlap (Pass, designer, developer, pantry#0..2, cub slots 0..7): test 7 (fails: architect#0)
8. Roam obstacle covers (1.5, 3.4) and plinth+margin; old (-3.0, 0.3) stays gone: test 8 (fails)
9. Face colours, basic material, name, label, click/Enter, "spills": tests 9-10 (unchanged, pass)
- human-verified: the user's browser check of the look and size.

## Developer notes
- TALLY needs `rotationY` (about -0.183) and groundY 0; plinth bottom is at groundY - 0.02, so top = 1.53. Remove MOUND_Q.
- Roam obstacle rect x 0.85..2.15, z 3.1..3.7. Test 8 probes (0.9, 3.15) and (2.1, 3.65), so keep those inside.
- Tests use hand-worked literals: Bao's feet at world y 0, table top y 0.7 at z 0, cub plush top y 0.8 at z 4.6 (cub row via placeCell("cub", slot, 8)).
- Removed: grove mound numbers, mound footprint, "farther than everything", near-bamboo. Dropped the old "smaller than 1.6" assert.
- Test 6 has a 0.003 screen-unit margin; do not raise the tablet or lower the plinth.
