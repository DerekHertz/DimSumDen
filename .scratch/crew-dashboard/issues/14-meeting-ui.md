# 14: Meeting UI: setup, transcript, brief, rejoin

**Type:** feature

**Priority:** P3

**Blocked by:** 06, 07, 08

**Status:** parked

**Design refs:** `.scratch/crew-dashboard/spec.md`

## What to build

Setup panel (topic, up to six participants, depth, cost estimate), transcript with takes and 'Asks you' cards, decision-brief view, and 'Pick up where you left off' for rejoin. A meeting must complete with no scene. The war-room table is a later design session.

## Acceptance criteria

- [ ] Setup refuses a seventh participant and shows the estimate
- [ ] The transcript shows each take's confidence and cost
- [ ] Choosing a brief option records the gate request
- [ ] Rejoin shows the suggested core members
- [ ] The user inspects it in the browser (visual verdict)

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
- **orchestrator, 2026-10-03:** Parked: not a v1 den-loop step; revisit when growing the den (refocus, docs/refocus/triage-2026-10-02.md)
