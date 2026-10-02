# 02: `noop` and `clarify` outcomes in the handoff State block

**Type:** feature

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Design refs:** `.scratch/crew-dashboard/spec.md`

## What to build

The handoff State block and `board release` accept two new outcomes. `noop` carries a one-line reason. `clarify` carries a question and appears as a Needs-you item of its own kind (not a pass gate); answering it later is a steering command. `board handoff --template` prints the new values. The `handoff` and `organism-protocol` skills name them.

## Acceptance criteria

- [ ] `board handoff` validates a State block with `outcome: noop` and a reason, and refuses `noop` with no reason
- [ ] `outcome: clarify` with a question writes a Needs-you record the bridge snapshot lists (test on the snapshot)
- [ ] `board release` accepts a noop or clarify handoff for the claiming cell and mode
- [ ] The template output passes validation
- [ ] Existing handoffs without an outcome field still validate

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
