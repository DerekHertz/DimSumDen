# 10: Front of House door-guard skin on Needs you

**Type:** feature

**Priority:** P3

**Blocked by:** 08

**Status:** ready-for-agent

**Design refs:** `.scratch/crew-dashboard/spec.md`

## What to build

A guard or lantern at the den's entrance carries the Needs-you count in the scene. It is a skin on the existing count: no new data, no new approval path.

## Acceptance criteria

- [ ] The count in the scene always equals the Needs-you card count (test)
- [ ] No new route or record is added
- [ ] Reduced motion and both themes covered
- [ ] The user inspects it in the browser (visual verdict)

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
