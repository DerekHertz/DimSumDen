# 04: Walk mode in the new den

**Type:** feature

**Priority:** P2

**Blocked by:** 02

**Status:** ready-for-agent

**Serves:** den-layout spec "Wiring decisions": den-v1 builds on the new scene. den-v1/03 walk mode, carried into PR #162's site plan.

## What to build

Walk mode (den-v1/03) works in the new den: the user walks Bao around PR #162's restaurant and is blocked by its site-plan obstacles (`apps/ui/src/review/site-plan.mjs`) instead of the old scene's. Reuse den-v1/03's controls and camera; only the obstacle source and spawn point change.

No designer spec or review (user, 2026-10-06).

## Acceptance criteria

- [ ] Walk mode enters, moves and exits in the new den with den-v1/03's controls
- [ ] Movement is blocked by the site plan's stations and walls (unit test on the obstacle source)
- [ ] The spawn point is inside a walkable area of the site plan (test)
- [ ] `npm test` and `npm run smoke:ui` pass

## Comments

- **orchestrator, 2026-10-06:** Published from the approved breakdown (user, 2026-10-06). No designer on this ticket (user override). Can run alongside 03 if their files don't overlap.
- **orchestrator, 2026-10-06:** From 02 scope (user, 2026-10-06): 02 drops the smoke:ui 'walk: Enter the den' check; 04 re-adds it against the new den.
