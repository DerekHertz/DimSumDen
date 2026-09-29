# Handoff: showcase-v1/04 message passing: developer

```json
{"ticket": "showcase-v1/04", "cell": "developer", "current_step": "implemented and pushed; awaiting browser check and qa verify",
 "artifacts": ["apps/ui/src/scene/handoffs.mjs", "apps/ui/src/scene/handoffs.test.mjs", "apps/ui/src/scene/handoff-fixture.mjs", "apps/ui/src/scene/handoff-fixture.test.mjs", "apps/ui/src/handoff-state.js", "apps/ui/src/scene/Market.jsx", "apps/ui/src/scene/scene-from-state.mjs", "apps/ui/src/scene/camera-rig.mjs", "apps/ui/src/scene/CameraRig.jsx", "apps/ui/src/scene/banquet-layout.mjs", "apps/ui/src/scene/stall-roof.mjs"],
 "decisions": ["dur-slow defined as 700 ms (no token existed)", "sender point pose skipped: the director has no point clip", "baskets are shown for active and queued tickets, not queued only", "grove sway is a sideways drift, not a lean"],
 "failures": ["browser smoke cannot run here (Chromium 1194 vs Playwright 1243)"],
 "pending": [{"item": "browser check: turn animation, heart bubble, lantern and bell, ?demo=handoff, panning, back-row visibility", "owner": "qa"}]}
```

## State
Done, in-review. Branch `showcase-v1/integration`.

## What changed
- `handoffs.mjs` (pure): `deriveHandoffs(prev, next)` (station change, same-station change; new, resolved and first snapshot give none), `trackedTickets`, `susanLayout` (baskets turned toward their station, non-overlapping, cap 12), `turnAngle`/`lerpAngle` (dur-slow 700 ms, jump under reduced motion), `lanternState` (stall lanterns and bell).
- `scene-from-state.mjs`: queued tickets no longer get a cell; existing tests updated to match.
- `Market.jsx`: susan no longer spins; baskets per ticket turn on handoff; roof lanterns lit with the lantern token; service bell on Bao's crown (`BELL`); back stalls on a 0.5 platform; front stalls have a low roof.
- `handoff-state.js` (hooks), `App.jsx`, `Den.jsx`, `ChipLayer.jsx` (heart bubble on the receiver, static under reduced motion), `styles.css`.
- `?demo=handoff` plays `handoff-fixture.mjs` (qa to developer to security, then a merge gate).
- Camera: `panLimit(aspect, zoom)` from the visible half-width at the stall row so the widest stall (12 cells, edge 12.675) is reachable; zero on a wide window. `CameraRig.jsx` applies it.

## User asks folded in (from the browser check of 02)
- Grove sway period 8 s (was 2.8), drifting sideways instead of leaning; grove widened to x +-26 with more stalks.
- Tea and Pantry moved from |x| 4.8 to 4.0; Steamers and Front of House on a +0.5 platform, front roofs lowered (eave 1.4, rise 0.4). Unit test: the sight line from the default camera to every back-row cell clears the front roof apex.

## Next step
qa verify in a browser.

## Gotchas
- Scene/UI/packages tests all pass (276). `npm run ui:build` succeeds. Full `npm test` also has the 5 browser smoke failures.
- Pan-limit depth ignores the camera pitch (approximate).
- Camera rig sway/limit and the sight-line test assume the default camera (0, 4.2, 11.5); panning changes what is hidden.
