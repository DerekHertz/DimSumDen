# 08: Remove the market scene and glbs that #151 replaced

**Type:** task

**Priority:** P2

**Blocked by:** 01, 03, 04 (batch D1: PR #151 must merge first)

**Status:** ready-for-agent

**Serves:** ADR 0019 decision 7 (Blender out, procedural three.js only) and test-time cost: after #151, `App.jsx` renders `apps/ui/src/scene/procedural/` only, and nothing in it loads a glb.

## What to build

Delete the market scene that #151 left as dead code, with its tests: `apps/ui/src/scene/` modules no longer imported from `apps/ui/src/App.jsx` or `apps/ui/src/scene/procedural/` (for example `Den.jsx`, `Market.jsx`, `Backdrop.jsx`, the old `CameraRig.jsx`, `dev-scene.*`, `headgear.mjs`, `bao-rig.fixture.mjs`), `apps/ui/src/assets/` (`panda-contract.mjs`, `prop-placement.mjs`), and the glbs and textures in `apps/ui/public/models/` (4.2 MB). Keep anything still imported (check with an import graph from `apps/ui/src/main.jsx`, not by name). Update `apps/ci-cd/smoke-ui.mjs` and docs that reference removed files.

## Acceptance criteria

- [ ] No file under `apps/ui/src/` or `apps/ui/public/` is unreachable from `apps/ui/src/main.jsx` except tests of reachable modules (a script or test proves it).
- [ ] No `.glb` remains in the repo outside `.scratch/`.
- [ ] `npm run ui:build`, `npm test` and `npm run smoke:ui` are green, and the test count drop is listed in the handoff.

## Comments

- **Created (orchestrator, 2026-10-03):** Found while reviewing #151 (it switches App to the procedural den). Also shrinks organism-infra/125 to the Blender sources and skill only.
