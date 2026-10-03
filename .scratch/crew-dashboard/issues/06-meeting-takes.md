# 06: Meeting takes, up to six, in sequence

**Type:** feature

**Priority:** P2

**Blocked by:** organism-infra/107, 05

**Status:** parked

**Design refs:** ADR 0017

## What to build

A meeting runs up to six participant cells one after another, each writing one take (claim, evidence, confidence, what it would keep or change, at most one question) through the steering channel. A cost estimate is shown first and a meeting that would cross the usage limit refuses to start. Participants may return `noop`. The chair then writes the brief from the takes. Parallel takes only on request.

## Acceptance criteria

- [ ] Takes are written in order and each is stored with the meeting tool
- [ ] The estimate is computed before the first spawn and refuses to start over the limit (fake runtime test)
- [ ] A seventh participant is refused
- [ ] A `noop` take is recorded with its reason and cost
- [ ] The chair brief cites the roles backing each option

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
- **orchestrator, 2026-10-03:** Parked: not a v1 den-loop step; revisit when growing the den (refocus, docs/refocus/triage-2026-10-02.md)
