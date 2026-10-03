# 03: Walk mode: enter the den in first person

**Type:** feature

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** in-review

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
