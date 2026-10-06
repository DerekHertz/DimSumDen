# 08: Remove the market scene and glbs that #151 replaced

**Type:** task

**Priority:** P2

**Blocked by:** 01, 03 (batch D1: PR #151 must merge first)

**Status:** resolved

**Serves:** ADR 0019 decision 7 (Blender out, procedural three.js only) and test-time cost: after #151, `App.jsx` renders `apps/ui/src/scene/procedural/` only, and nothing in it loads a glb.

## What to build

Delete the market scene that #151 left as dead code, with its tests: `apps/ui/src/scene/` modules no longer imported from `apps/ui/src/App.jsx` or `apps/ui/src/scene/procedural/` (for example `Den.jsx`, `Market.jsx`, `Backdrop.jsx`, the old `CameraRig.jsx`, `dev-scene.*`, `headgear.mjs`, `bao-rig.fixture.mjs`), `apps/ui/src/assets/` (`panda-contract.mjs`, `prop-placement.mjs`), and the glbs and textures in `apps/ui/public/models/` (4.2 MB). Keep anything still imported (check with an import graph from `apps/ui/src/main.jsx`, not by name). Update `apps/ci-cd/smoke-ui.mjs` and docs that reference removed files.

## Acceptance criteria

- [ ] No file under `apps/ui/src/` or `apps/ui/public/` is unreachable from `apps/ui/src/main.jsx` except tests of reachable modules (a script or test proves it).
- [ ] No `.glb` remains in the repo outside `.scratch/`.
- [ ] `npm run ui:build`, `npm test` and `npm run smoke:ui` are green, and the test count drop is listed in the handoff.

## Comments

- **Created (orchestrator, 2026-10-03):** Found while reviewing #151 (it switches App to the procedural den). Also shrinks organism-infra/125 to the Blender sources and skill only.
- **orchestrator, 2026-10-04:** Dropped the `Blocked by` edge to den-v1/04 (user, 2026-10-04); 04 stays parked.
- **qa, 2026-10-06:** qa specify done
- **qa, 2026-10-06:** QA bounce: apps/ui/src/overlay/floating-cards.test.mjs deleted but it passes (33/33) against HEAD and tests the live App overlay (Cards.jsx, Bottom.jsx). Restore it; qa will widen the walker's keep rule. Rest green: npm test 1763/1763, ui:build, smoke:ui 11 PASS, no glb. See 08-qa-verify.md.
- **qa, 2026-10-06:** QA pass @ 29875f1: floating-cards.test.mjs restored unchanged, reachability 7/7, ui:build and smoke:ui green. npm test 1796/1797; the one failure (organism-infra board-status-and-lock.test.mjs:159) is an unrelated timing flake, passes alone. See 08-qa-verify-r2.md.
- **security, 2026-10-06:** Security pass. No critical/high/medium findings. reachability.test.mjs:155 execFileSync is fixed-argv, no shell (low, informational). gitleaks clean, no dep/CI changes. See handoffs/08-security.md.
