# den-iso-v1/02: qa verify bounce handoff

Branch `feat/ortho-iso-camera02`, commit `8fa4065` (base `981b3e3`). BOUNCE: one legacy test times out.

```json
{
  "ticket": "den-iso-v1/02-ortho-iso-camera",
  "cell": "qa",
  "mode": "verify",
  "current_step": "BOUNCE: tally-expand.test.mjs:144 times out on Playwright click; 1638/1639 tests pass. Developer to investigate.",
  "artifacts": [
    "All qa-specified tests pass: iso-projection.test.mjs, camera-rig.test.mjs, default-framing.test.mjs, ortho-camera-wiring.test.mjs, smoke-ui.mjs camera tests"
  ],
  "decisions": [
    "All 24 qa-specified acceptance-criteria tests pass without assertion changes",
    "Five legacy tests migrated to iso-projection API: kiosk, horseshoe-layout, tally-pill, tally-stele pass; tally-expand passes except for one Playwright timeout",
    "smoke:ui 10/10 PASS (camera fit x2, zoom, pan)",
    "ChipLayer viewport fix correct and minimal (3 lines)",
    "smoke-ui.mjs 'camera zoom' wait predicate does not loosen fits() assertion"
  ],
  "failures": [
    "tally-expand.test.mjs:144 'a quiet den' test - TimeoutError on pill.click() after 8s. Test logic unchanged from base (981b3e3). Unclear if pre-existing flaky or caused by projection render timing."
  ],
  "pending": [
    {"item": "Investigate tally-expand.test.mjs:144 timeout: pre-existing flaky test or caused by projection changes? Re-run full npm test.", "owner": "developer"},
    {"item": "All acceptance criteria tested and mapped; criterion 6 remains human-verified, ready-for-human", "owner": "orchestrator"}
  ]
}
```

## Test Results Summary

**npm test:** 1638/1639 PASS
- Failed: tally-expand.test.mjs:144 - Playwright TimeoutError on pill.click()
- All qa-specified new/rewritten tests: PASS
- All 4 other legacy migrations: PASS (kiosk, horseshoe-layout, tally-pill, tally-stele)

**npm run smoke:ui:** 10/10 PASS (camera fit 1440x900, fit 375x667, zoom scaling, pan dragging, load, fonts, scene, queue, chart, approve)

## Criterion-to-Test Map (All Criteria Covered)

| Criterion | Test | Status |
|---|---|---|
| Orthographic camera at yaw 0, pitch atan(1/√2) | iso-projection.test.mjs (PITCH literal, cameraConfig type orthographic yaw 0); ortho-camera-wiring.test.mjs (Canvas orthographic) | PASS |
| World to screen round-trips within 1e-6 | iso-projection.test.mjs (2 sizes x 4 zooms x 3 targets x 7 points) | PASS |
| Default frame contains everything at 1440x900 and 375x667 | default-framing.test.mjs (kiosks, Bao, susan, tally, sign anchors inside viewport) | PASS |
| Zoom clamps to 0.55-1.2; pan clamps to limits | iso-projection.test.mjs (range/panLimits); camera-rig.test.mjs (clampZoom, clampTarget) | PASS |
| Wheel zoom and drag pan work in smoke:ui | smoke-ui.mjs camera zoom (1/0.7 scaling) and camera pan (100px drag moves signs) | PASS |
| Phone-width fit at 375x667 | smoke-ui.mjs camera fit 375x667 (and 1440x900) | PASS |
| No sign/counter covered (den-map check 1) | default-framing.test.mjs (screen-rect geometric check) | PASS |
| User inspects den in browser | ready-for-human, criterion 6 | OPEN |

## Files Outside Ticket Scope (Developer Touched)

1. **apps/ui/src/scene/ChipLayer.jsx**: Reads camera.userData.viewport instead of stage.size (3-line change). Necessary fix to avoid pairing new viewport size with old camera frustum after resize.
2. **apps/ci-cd/smoke-ui.mjs**: Added centred-on-scene predicate before camera zoom baseline. Waits for signs to be centered (not loosening fits() assertion, just gating when baseline is taken). Necessary to avoid stale layout from previous viewport width.

## Bounce Reason

Light verify rule: "Every test passes and none are skipped; otherwise bounce with the failing names."
- tally-expand.test.mjs:144 fails with Playwright TimeoutError on pill.click() 
- 1638 of 1639 tests pass
- Test logic itself is unchanged from base commit (no weakening of assertions)
- The timeout is a browser automation issue, possibly pre-existing flaky test or timing change from projection refactor
- Developer should investigate and re-test before re-submission
