# 107: Steering slice 2: message and hand over

**Type:** feature

**Priority:** P1

**Blocked by:** 106

**Status:** ready-for-agent

**Design refs:** `docs/adr/0016-ui-steering-channel.md` decision 7, slice 2

## What to build

Build ADR 0016 slice 2: `POST /cells/:id/message`, queued, acknowledged and applied reporting, cancel while queued, and the stop-then-resume hand-over. Wording follows spike S7.

## Acceptance criteria

- [ ] A message sent during a running turn is reported queued, then acknowledged, then applied (fake runtime)
- [ ] Cancel is accepted only while queued
- [ ] The resume string is shown, never run by the bridge

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
