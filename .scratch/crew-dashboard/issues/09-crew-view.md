# 09: Crew view-model and view

**Type:** feature

**Priority:** P3

**Blocked by:** 03, 08

**Status:** parked

**Design refs:** `.scratch/crew-dashboard/spec.md`

## What to build

The Crew view: a pure view-model (snapshot `crew` key in, role cards and Next-up out) and a component, reachable from a view toggle, Ctrl K and any zoom level. Dormant roles read 'coming online'. Plain list on a phone. Works in Demo mode. This is test seam 2.

## Acceptance criteria

- [ ] The model returns correct cards for a working, a noop, a failed and a dormant role (pure test)
- [ ] The view is reachable by keyboard and works at 375px (one `smoke:ui` test)
- [ ] Labels use den words; no biology word in a label or `aria-label`
- [ ] Demo mode fixture shows the view
- [ ] The user inspects it in the browser (visual verdict)

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
- **orchestrator, 2026-10-03:** Parked: not a v1 den-loop step; revisit when growing the den (refocus, docs/refocus/triage-2026-10-02.md)
