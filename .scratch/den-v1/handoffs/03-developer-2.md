# den-v1/03 developer handoff 2 (batch D1 fix round, PR #151, branch codex/procedural-den-frontend @ 0604c76)

```json
{
  "ticket": "den-v1/03-walk-mode",
  "cell": "developer",
  "current_step": "Fix round done: pure walk core extracted with unit tests, smoke zoom/pan repaired for the exponential contract, smoke walk check added. npm test 1984 pass, 0 fail, 0 skipped; npm run smoke:ui passed 4 consecutive runs after the last edit (one earlier run of the first walk-check draft failed on a fixed 1.2 s sleep, replaced by polling). Pushed. Ready for qa verify.",
  "artifacts": [
    "codex/procedural-den-frontend@0604c76",
    "apps/ui/src/scene/procedural/walk.mjs",
    "apps/ui/src/scene/procedural/walk.test.mjs",
    "apps/ui/src/scene/procedural/explorer.mjs",
    "apps/ci-cd/smoke-ui.mjs",
    "docs/design/2026-10-01-iso-den.md"
  ],
  "decisions": [
    "User decision applied: walk(state, input, dt, world) -> state is a pure module (procedural/walk.mjs, no three or DOM), createDenExplorer is a thin adapter that gathers keys, mouse and the den's obstacles and calls it each frame. state is {x,z,y,yaw,pitch,walkTime}; input is {forward,strafe,sprint,look:{dx,dy},reducedMotion}; world is {obstacles (den.obstacles), avoid: [{x,z,r}] (visible roaming pandas)}. The ticket named roam.mjs roamObstacles; the live den uses den.obstacles, so the core takes those. isDenPositionBlocked moved into walk.mjs and is re-exported from explorer.mjs.",
    "AC1 tests (walk.test.mjs): floor edge on all four sides (x +/-11.65, z -10.4 and 9.35), a box stall (stops 0.26 clear of the face, slides along it at a slant), a rotated box, a round prop, a roaming panda, and a 25 s walk in seven headings through the real den that never ends in a prop or off the floor.",
    "AC2 tests: pitch clamps at -1.20 and 1.30 (pure and through the adapter's mouse path); 1 s of walking at 30 and 120 fps agree within 5% (and a strafe-diagonal case); speed 2.1 m/s, sprint 3.5, diagonal not faster.",
    "AC3: Enter and Esc covered by the existing keys test plus a new one (same start frame each visit, orbit navigation off then on). The diorama camera frame is untouched by walking by construction (the explorer owns a separate camera; CameraRig swaps back to the stored one). The frame restore is verified in a real browser by the new smoke check: station signs before Enter and after Esc agree within 2 px. CameraRig.jsx has no node-level test.",
    "AC4: smoke-ui.mjs adds 'walk: Enter the den, move with W, Esc returns the diorama to the same frame'. It clicks the button, checks aria-pressed and the crosshair, holds W (polling up to 8 s, since the software-rendered scene runs at a few fps) until the station signs move, presses Esc, and checks the signs return within 2 px. Headless pointer lock is not asserted; the fallback and lock paths both end in the same Esc handler.",
    "Zoom contract: kept exponential (user decision). smoke zoom now expects 1/exp(-0.3) = 1.3499 (measured 1.331 to 1.349 across runs, tolerance 0.03). Added a unit test on procedural wheelZoom (literals 0.7408 and 0.9048, reversible, same ratio at any zoom, clamped 0.55 to 1.2). docs/design/2026-10-01-iso-den.md updated (wheel d *= exp(deltaY * 0.001)). camera-rig.mjs (old linear, unreferenced by App.jsx) left as is.",
    "Smoke pan: the QA analysis of the 0.55 clamp was a bit off. At 1440x900 the default Steamers to Front of House gap is about 611 px, so about 1120 px at the nearest zoom: Steamers, Front of House, Library and Drum stay on screen; only Tea and Pantry are hidden by ChipLayer. The pan check now measures the signs that stay on screen with 110 px of room (it requires Steamers and Front of House among them); measured shift 98 to 99 px.",
    "Designer was asked to confirm the exponential feel in the orchestrator's comment; I did not involve designer."
  ],
  "failures": [],
  "pending": [
    {"item": "qa verify of batch D1 (full)", "owner": "qa"},
    {"item": "designer to confirm exponential wheel zoom feel (per the 2026-10-03 user decision)", "owner": "orchestrator"}
  ]
}
```
