# 03: Walk mode: enter the den in first person

**Type:** feature

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** claimed

**Serves:** Den loop step 2 (enter the den).

## What to build

An "Enter the den" control and key in the diorama switch to walk mode: a perspective camera at eye height in the frozen iso layout, WASD and arrow keys to move, mouse to look (pointer lock), Esc to return to the diorama at the same spot. Movement is a new pure module `walk(state, input, dt, obstacles) -> state` in `apps/ui/src/scene/` that stops at the floor boundary and at the stall and panda boxes from `roamObstacles` in `apps/ui/src/scene/roam.mjs`. A thin R3F component applies it each frame.

## Acceptance criteria

- [ ] Walking into a stall box or the floor edge stops at the edge (unit tests on `walk`).
- [ ] Pitch is clamped; movement per second is the same at 30 and 120 fps within 5%.
- [ ] Enter and Esc switch modes and Esc returns the diorama camera to its previous frame.
- [ ] `npm run smoke:ui` enters walk mode, moves, and exits with Esc.
- [ ] `npm test` is green.

## Comments

- **Created (orchestrator, 2026-10-03):** From `.scratch/den-v1/spec.md` (ADR 0019). Keep under ~120k tokens; split rather than stretch.
- **orchestrator, 2026-10-03:** Re-scoped (user, 2026-10-03): land PR #151 (Codex's procedural den, branch codex/procedural-den-frontend), which covers den-v1 01, 03 and 04 in one change; review it against this ticket's criteria and fix the gaps on that branch. Batch D1 = den-v1/01, 03, 04, one PR.
- **qa, 2026-10-03:** QA bounce (batch D1 @94221b2): no tests for edge/box stop, pitch clamp, 30/120 fps, camera restore (explorer.mjs; frontend.test.mjs:136 covers keys only); smoke-ui.mjs has no walk check; smoke zoom fails on camera.mjs:18 exponential wheelZoom (regression), pan on stale sign assumptions. See 03-qa handoff.
- **orchestrator, 2026-10-03:** User decision 2026-10-03: keep exponential wheel zoom (procedural/camera.mjs:18). Fix round updates the smoke zoom check, docs and tests to the exponential contract; designer to confirm feel. createDenExplorer vs pure walk(): pending user decision.
- **orchestrator, 2026-10-03:** User decision 2026-10-03: extract a pure walk(state, input, dt) core; createDenExplorer stays as a thin THREE/DOM adapter over it. Edge/stall stop, pitch clamp, fps independence and Esc restore get node --test unit tests on walk(); smoke keeps one walk check.
- **orchestrator, 2026-10-03:** User 2026-10-03: paused 04 (parked). Batch D1 is now 01 + 03 only. Fix round on #151 (codex/procedural-den-frontend @ 94221b2): 01 tests, 03 walk() core + tests + smoke walk check, exponential zoom contract (smoke zoom/pan, docs, tests). Goal: get the updated UI wired and merged.
