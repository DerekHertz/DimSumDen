# Handoff: showcase-v1/06 idle pandas roam: developer

```json
{"ticket": "showcase-v1/06", "cell": "developer", "current_step": "implemented and pushed; awaiting browser check and qa verify",
 "artifacts": ["apps/ui/src/scene/roam.mjs", "apps/ui/src/scene/roam.test.mjs", "apps/ui/src/scene/Den.jsx"],
 "decisions": ["one RoamFigure per roamer type (8: every type but orchestrator); the first cell of a type IS that panda, extra cells stay at the stall", "pose is idle while walking (no walk clip exists), with a small hop bob", "reduced motion fades out on the grass, reappears at the slot, fades in; no walking", "obstacles follow live stall widths, so a widening stall can make a roamer near it jump"],
 "failures": ["browser smoke cannot run here (Chromium 1194 vs Playwright 1243)"],
 "pending": [{"item": "browser check: roaming looks calm, routes around stalls/table/Bao/Tally, walk-in/out, reduced-motion fade, chips follow a working panda", "owner": "user"}]}
```

## State
Done, in-review. Branch `showcase-v1/06-idle-roam`, commit 83088ac, pushed.

## What changed
- `roam.mjs` (pure): `roamAt(seed,t,obstacles)` wander (30 s segments, walk then stand, speed 0.5), `roamObstacles(counts)` (Bao, Tally, table, stalls at live width, cub basket and row, padded 0.4), `planRoute` (visibility-graph detours), `approachFor`, `stepRoamer` lifecycle idle -> to-slot -> working -> out -> idle (walk 0.9) plus reduced-motion fade.
- `roam.test.mjs`: 16 tests (bounds, obstacles, determinism, speed cap and no jumps, pauses, spread homes, routing, approach spots, lifecycle, mid-walk release, reduced motion hold and fade).
- `Den.jsx`: `RoamFigure` per type; `Figure` gained `anchorId` (chips and selection follow the cell ref, null when idle) and `fadeRef`.

## Gotchas
- Tests were written together with the module, not strictly red first.
- Selecting or chips: a working roamer uses the cell's ref as anchor; while walking the chip follows it.
- Full `npm test`: 773 pass, 5 fail (the browser smoke tests only). `ui:build` succeeds.
- Roam bounds (x +-8, z -3..6.5) and home spots are guesses about the camera view; adjust `ROAM_BOUNDS`/`HOMES` after the browser check.
