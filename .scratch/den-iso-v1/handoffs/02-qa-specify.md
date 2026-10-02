# den-iso-v1/02: qa specify handoff

Branch `tests/ortho-iso-camera02`, commit `981b3e3` (base `9a3e0fa`). Tests only. All new tests fail for a missing feature (module not found, wrong exports, perspective camera still in place). Full `npm test` on the branch: 24 failures, all in the files below; the other 1612 pass.

```json
{
  "ticket": "den-iso-v1/02-ortho-iso-camera",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing acceptance tests committed on tests/ortho-iso-camera02 (981b3e3). Developer makes them pass.",
  "artifacts": [
    {"path": "apps/ui/src/scene/iso-projection.test.mjs", "note": "new: projection math, camera config, pan limits"},
    {"path": "apps/ui/src/scene/camera-rig.test.mjs", "note": "rewritten for the ortho rig"},
    {"path": "apps/ui/src/scene/default-framing.test.mjs", "note": "rewritten: fit at 1440x900 and 375x667, den-map check 1"},
    {"path": "apps/ui/src/scene/ortho-camera-wiring.test.mjs", "note": "new: source wiring of Canvas and CameraRig"},
    {"path": "apps/ci-cd/smoke-ui.mjs", "note": "three new checks: camera fit (x2), camera zoom, camera pan"},
    {"path": "apps/ci-cd/smoke-ui.test.mjs", "note": "expects the new PASS lines"}
  ],
  "decisions": [
    "Module name and API are mine to fix, since the ticket leaves them open: apps/ui/src/scene/iso-projection.mjs (see below).",
    "The digest's pixel table (section 1) is the oracle, within 2 px, as the digest states.",
    "Steamers/Front of House move to +-3.0 is NOT tested here (tickets 04/06 own the layout moves); every geometry test passes with either +-3.3 or +-3.0, checked with a scratch implementation that I deleted.",
    "TALLY.rotationY === 0 is tested: the digest ties it to this camera change."
  ],
  "failures": [],
  "pending": [
    {"item": "Implement iso-projection.mjs, rewrite camera-rig.mjs, drop the perspective constants, switch App.jsx to an orthographic Canvas, rework CameraRig.jsx, set TALLY.rotationY to 0", "owner": "developer"},
    {"item": "Migrate five other tests that import cameraPosition/FOV_DEG from camera-rig.mjs (they will break when those go): kiosk.test.mjs:8, horseshoe-layout.test.mjs:8, tally-pill.test.mjs:9, tally-stele.test.mjs:12, tally-expand.test.mjs:24. They build a PerspectiveCamera; port them to defaultFrame/worldToScreen without weakening assertions. Outside the ticket's file list: orchestrator to confirm.", "owner": "developer"},
    {"item": "Orchestrator scope question: styles.css has .shell min-width 1280px and a 440px panel, so at a 375 px viewport the scene box is 840 wide. The ticket's file list does not include styles.css. The phone smoke check forces a 375x667 scene by injecting CSS, so it tests the camera fit only. Real phone layout stays with ticket 07 unless the user wants it here.", "owner": "orchestrator"}
  ]
}
```

## Interface the tests fix

`iso-projection.mjs`, with `view = { width, height, zoom = 1, target = [0, 0, -2.4] }`:
`YAW` (0), `PITCH`, `TARGET`, `ZOOM_MIN`, `ZOOM_MAX`, `clampZoom`, `pixelsPerUnit(view)`, `worldToScreen([x,y,z], view) -> {x,y}`, `screenToWorld({x,y}, view, groundY = 0) -> [x,y,z]`, `defaultFrame({width,height})`, `cameraConfig(view)` (type "orthographic", position, target, up, near 0.1, far 120, left/right/top/bottom, yaw, pitch; frustum is offset so the target lands at 0.52 H), `panLimits(view) -> {x, z}`.

`camera-rig.mjs`: keeps `ZOOM_MIN/MAX`, `clampZoom`, `keyZoom`, `wheelZoom` (same literals); new `clampTarget(target, view)`, `keyPan(target, key, view)`, `dragPan(target, {dx,dy}, view)`. Removed: `FOV_DEG`, `BASE_Y`, `BASE_Z`, `cameraPosition`, `PAN_LIMIT`, `panLimit`, `visibleHalfWidth`, `clampPan`; `camera-default.mjs` loses `FOV_DEG/BASE_Y/BASE_Z` too (it may become empty or be deleted; the test imports it and expects no such exports, so keep the file or the test errors).

## Criterion-to-test map

| Criterion | Test |
|---|---|
| Orthographic camera at the digest's yaw and pitch | `iso-projection.test.mjs`: pitch literal; cameraConfig orthographic, yaw 0, 40 units, square pixels; three OrthographicCamera built from the config reproduces the pixel table; config agrees with worldToScreen under zoom and pan. `ortho-camera-wiring.test.mjs`: Canvas has `orthographic`, no `fov`; rig uses the module; no perspective constants in app/scene source |
| World to screen to world round-trips | `iso-projection.test.mjs`: round-trip across 2 sizes x 4 zooms x 3 targets x 7 points (1e-6); ground-pick literals |
| Default frame contains everything at 1440x900 and 375x667 | `iso-projection.test.mjs`: table within 2 px. `default-framing.test.mjs`: kiosks (full geometry), Bao, susan, hamper, Tally and the four sign anchors inside the viewport |
| Zoom clamp, pan clamp | `camera-rig.test.mjs` (clampZoom, wheelZoom, keyZoom, dragPan, keyPan, clampTarget), `iso-projection.test.mjs` (range, panLimits with hand-worked 1.872 and 0.542) |
| Wheel zoom and drag pan work in smoke:ui | `smoke-ui.mjs`: "camera zoom" (spacing x 1/0.7, clamps at 1/0.55 and 1/1.2), "camera pan" (100 px drag moves all signs 100 px) |
| Phone-width fit | `smoke-ui.mjs`: "camera fit ... 375x667" (and 1440x900); pure table above |
| No sign or counter covered (den-map check 1) | `default-framing.test.mjs`: counters vs counters/Bao/table, signs vs other kiosks/Bao/table, both sizes |
| User verdict | human-verified (`ready-for-human`) |

## Changes to existing tests (so verify does not read them as weakened)

`camera-rig.test.mjs` and `default-framing.test.mjs` replaced their perspective-only tests (cameraPosition literals, panLimit/visibleHalfWidth with FOV, PAN_LIMIT 9, old drag/key signatures, FOV-based framing). Kept verbatim: zoom limits, clampZoom, keyZoom, wheelZoom, MAX_STALL_CELLS. The old complete-kiosk and check-1 geometry helpers carry over; the table radius is now `TABLE.radius` (1.3).
