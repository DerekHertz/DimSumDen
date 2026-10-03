# 13: Answer a `clarify` question in Needs you

**Type:** feature

**Priority:** P3

**Blocked by:** 02, organism-infra/106, 09

**Status:** parked

**Design refs:** `.scratch/crew-dashboard/spec.md`

## What to build

A cell's clarify question appears under Needs you with a text answer. Answering is a steering command; the cell continues or restarts with the answer.

## Acceptance criteria

- [ ] A clarify item shows its question and cell
- [ ] Answering sends the steering command and clears the item
- [ ] An expired item is not answerable

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
- **orchestrator, 2026-10-03:** Parked: not a v1 den-loop step; revisit when growing the den (refocus, docs/refocus/triage-2026-10-02.md)
