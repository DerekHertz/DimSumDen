```json
{"ticket":"showcase-v1/01-banquet-layout","cell":"developer","current_step":"fix round 3 done, pushed 5ec846d, awaiting user browser check","artifacts":["apps/ui/src/scene/banquet-layout.mjs","apps/ui/src/scene/banquet-layout.test.mjs","apps/ui/src/scene/Market.jsx"],"decisions":["stallCenterX shifts overflowing stalls away from x=0; count<=3 unchanged"],"failures":[],"pending":[{"item":"User browser check; ADR 0013 update (table radius, stall x, cub row z, outward widening)","owner":"orchestrator"}]}
```

## State
Done, awaiting user browser check.

# Handoff: showcase-v1/01 developer, fix round 3

Branch `showcase-v1/01-banquet-layout`, commit 5ec846d, pushed.

Overflow widening now grows outward for all four stalls: new `stallCenterX(station, count)` in banquet-layout.mjs shifts the centre by half the extra width away from x=0, so the inner edge stays fixed (Steamers/Front of House inner edge at |x| 3.675). `placeCell` and `Market.jsx` both use it. Up to three cells nothing moves.

Tests: overflow literals updated (security with 5 cells now at 4.05/5.55/7.05), new test asserting the inner edge is fixed for every stall at 3, 5 and 8 cells, and a worked Steamers example. Scene tests: 97 pass. Full `npm test` not re-run.

Note: an 8-cell stall reaches |x| about 9.3 at its outer edge, beyond the camera pan limit of 5 and default view; raise PAN_LIMIT in camera-rig.mjs if that matters.
