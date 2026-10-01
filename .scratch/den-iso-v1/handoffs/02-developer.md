# den-iso-v1/02: developer handoff

Branch `feat/ortho-iso-camera02`, commit `8fa4065` (on qa's tests commit `981b3e3`). qa's 24 failing tests pass unchanged; `npm test` 1639/1639 and `npm run smoke:ui` all PASS.

```json
{
  "ticket": "den-iso-v1/02-ortho-iso-camera",
  "cell": "developer",
  "current_step": "Implemented and committed on feat/ortho-iso-camera02; all tests and smoke:ui green. Criterion 6 (user inspects the den in the browser) remains.",
  "artifacts": [
    {"path": "apps/ui/src/scene/iso-projection.mjs", "note": "new: projection, camera config, pan limits, default frame"},
    {"path": "apps/ui/src/scene/camera-rig.mjs", "note": "input math on the look-at target"},
    {"path": "apps/ui/src/scene/CameraRig.jsx", "note": "applies cameraConfig each frame; stamps camera.userData.viewport"},
    {"path": "apps/ui/src/scene/ChipLayer.jsx", "note": "projects with camera.userData.viewport"},
    {"path": "apps/ui/src/App.jsx", "note": "orthographic Canvas"},
    {"path": "apps/ui/src/scene/banquet-layout.mjs", "note": "TALLY.rotationY = 0; no camera-default import"},
    {"path": "apps/ui/src/scene/camera-default.mjs", "note": "now empty (the test imports it)"}
  ],
  "decisions": [
    "Legacy tests migrated (orchestrator decision 1): kiosk, horseshoe-layout, tally-pill, tally-stele, tally-expand now use defaultFrame/worldToScreen. tally-stele: the perspective-only sideways x checks became 2D screen-rect non-overlap against the table, Bao and the Pantry and Front of House kiosk bodies; the 'left edge projected to Bao's depth' test was dropped because an orthographic projection has no depth shift (Bao is covered by the rect check). Perspective bearing tests became rotationY === 0.",
    "ChipLayer fix (not in the ticket's file list, needed): stage.size updated a frame before the camera, so after a resize labels paired the new size with the old frustum. The rig stamps the viewport on camera.userData and ChipLayer uses it.",
    "smoke-ui.mjs 'camera zoom' (qa's file): the baseline probe could read a stale layout right after a viewport change (and in full npm test under load). I added a centred-on-the-scene predicate before the baseline; no assertion was loosened. qa verify should read it.",
    "styles.css untouched (orchestrator decision 2); Steamers and Front of House stay at +-3.3 (decision 3)."
  ],
  "failures": [],
  "pending": [
    {"item": "Verify: criterion 6, the user inspects the den in the browser (ready-for-human)", "owner": "qa"}
  ]
}
```
