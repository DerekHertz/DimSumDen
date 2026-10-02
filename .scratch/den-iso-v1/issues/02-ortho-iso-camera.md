# 02: Orthographic isometric camera (and the phone-width fit)

**Type:** feature

**Priority:** P1

**Blocked by:** 01

**Status:** resolved

**Design refs:** `docs/design/2026-10-01-iso-den.md` (the numbers; written by 01), `.scratch/den-iso-v1/spec.md`, `docs/design/den-map.md`.

## What to build

The den is drawn through an orthographic camera at the digest's isometric yaw and pitch. Kiosks, Bao, the susan and the tally keep one scale at every depth. Wheel zoom and pan still work. At the default zoom every kiosk shows at 1440x900 and at 375x667, which retires ticket den-scene-v1/10.

A pure projection module owns the math: world to screen and back, the zoom range, pan limits, and the default frame that contains every kiosk for a given viewport. The R3F scene and the camera rig consume it. The perspective camera constants go away.

**Files:** `apps/ui/src/scene/camera-default.mjs`, `apps/ui/src/scene/camera-rig.mjs`, `apps/ui/src/scene/CameraRig.jsx`, `apps/ui/src/scene/Den.jsx`, the projection module (new, same folder), and their tests (`camera-rig.test.mjs`, `default-framing.test.mjs`).

## Acceptance criteria

- [ ] The scene renders through an orthographic camera at the digest's yaw and pitch (test on the camera config)
- [ ] World to screen to world round-trips within a tolerance for sample points at several zooms (pure test)
- [ ] The default frame contains every kiosk, Bao, the susan and the tally at 1440x900 and at 375x667 (pure test over the layout constants)
- [ ] Zoom clamps to the digest's range; pan clamps to its limits; wheel zoom and drag pan still work in `smoke:ui`
- [ ] No kiosk sign or counter is covered by another kiosk, Bao or the table at the default frame (den-map check 1, geometric test)
- [ ] The user inspects the den in the browser and says it matches the frame (visual verdict, `ready-for-human`)

## Comments
- **qa, 2026-10-01:** qa specify: tests on tests/ortho-iso-camera02 (981b3e3), handoff 02-qa-specify.md. Criterion 6 (user inspects the den in the browser) is human-verified. Open scope question for the orchestrator: styles.css shell min-width 1280 means no real phone layout; the smoke check forces a 375x667 scene.
- **qa, 2026-10-01:** qa specify done; tests committed
- **qa, 2026-10-01:** Test failure: tally-expand.test.mjs:144 times out on Playwright click; 1638/1639 tests pass. All qa-specified tests pass (iso-projection, camera-rig, default-framing, ortho-camera-wiring, smoke-ui). smoke:ui 10/10 PASS. The failing test is a migrated legacy test; issue is Playwright timeout on pill.click(), not logic. Needs investigation: is this pre-existing flaky or caused by projection changes affecting render timing?
- **qa, 2026-10-01:** Light re-verify on commit 8fa4065: npm test 1639/1639 PASS, smoke:ui 10/10 PASS. No tally-expand timeout on this run (known CI flake, organism-infra/94). All acceptance criteria tested and passing. Criterion 6 (user inspects den) remains human-verified, ready-for-human.
