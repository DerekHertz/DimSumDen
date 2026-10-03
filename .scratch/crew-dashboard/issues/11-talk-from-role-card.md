# 11: Talk from a role card

**Type:** feature

**Priority:** P3

**Blocked by:** organism-infra/106, 09

**Status:** closed

**Design refs:** `.scratch/crew-dashboard/spec.md`

## What to build

Talk on a role card opens the composer aimed at that role and sends the existing dispatch or send command. It is disabled, with the reason, when the runtime cannot spawn the role.

## Acceptance criteria

- [ ] Talk is enabled only when the runtime capability allows (fake runtime test)
- [ ] The disabled state names the reason
- [ ] No new route is added

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
- **orchestrator, 2026-10-03:** Closed: superseded by the v1 den-loop interaction card, T key (refocus, docs/refocus/triage-2026-10-02.md)
