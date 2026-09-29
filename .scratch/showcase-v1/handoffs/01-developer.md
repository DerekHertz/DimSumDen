```json
{"ticket":"showcase-v1/01-banquet-layout","cell":"developer","current_step":"fix round 2 done, pushed 0aa46d0, awaiting user browser check","artifacts":["apps/ui/src/scene/banquet-layout.mjs","apps/ui/src/scene/banquet-layout.test.mjs","apps/ui/src/scene/stall-roof.mjs","apps/ui/src/scene/stall-roof.test.mjs","apps/ui/src/scene/Market.jsx"],"decisions":["stalls at |x| 4.8, all four for symmetry","crown frac 0.96 from measured head top (local y 0.95)","cub row z 4.6"],"failures":["5 browser smoke tests fail: Chromium 1194 vs 1243 (not re-run this round)"],"pending":[{"item":"User browser check; update ADR 0013 (table radius, stall x, cub row z)","owner":"orchestrator"}]}
```

## State
Done, awaiting user browser check.

# Handoff: showcase-v1/01 developer, fix round 2

Branch `showcase-v1/01-banquet-layout`, commit 0aa46d0 (on top of 1d6dd26), pushed.

## Done
1. Stalls moved out: all four from |x| 3.6 to 4.8 (steamers inner roof edge 3.675; Bao's shoulder cells reach about 2.24). Clearance test added.
2. Crown cell seated: orchestrator perch frac 1.02 to 0.96 (world y 2.856 to 2.688), from measure-glb head top at local y 0.95.
3. Post footprints inset by half a post (0.04) so they sit inside the counter corners; roof corners still equal post tops. Footprint test added.
4. Cub row moved from z 3.9 to 4.6, clear of the basket (new CUB_BASKET_RADIUS 0.55, test asserts clearance 0.35).

## Tests
Updated pinned literals in banquet-layout.test.mjs and stall-roof.test.mjs for the changed numbers (deliberate; user-requested). `node --test apps/ui/src/scene/*.test.mjs`: 95 pass. Full `npm test` not re-run; the 5 browser smoke failures from round 1 (Chromium mismatch) are expected.

## For the user to check
Steamers roof vs Bao's shoulder, crown cell seat (the 0.96 is derived from the head bone's box, not the rounded surface, so it may still sit a touch high or low), cub cell beside the basket, stalls not too far right/left at default view (pan covers it).
