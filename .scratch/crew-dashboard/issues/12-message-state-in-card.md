# 12: Queued, acknowledged and applied in the card

**Type:** feature

**Priority:** P3

**Blocked by:** organism-infra/107, 09

**Status:** closed

**Design refs:** `.scratch/crew-dashboard/spec.md`

## What to build

A message sent to a running cell shows queued, acknowledged, applied, or 'delivery not confirmed', and can be cancelled while queued.

## Acceptance criteria

- [ ] Each state renders from the fake runtime events
- [ ] Cancel works only while queued
- [ ] Unconfirmed delivery is worded as such

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
- **orchestrator, 2026-10-03:** Closed: folded into the den-v1 spec (refocus, docs/refocus/triage-2026-10-02.md)
