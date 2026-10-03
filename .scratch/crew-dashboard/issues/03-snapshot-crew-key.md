# 03: Snapshot `crew` key

**Type:** feature

**Priority:** P1

**Blocked by:** 01, 02

**Status:** parked

**Design refs:** `.scratch/crew-dashboard/spec.md`

## What to build

`buildSnapshot` returns an additive `crew` key: one entry per role with its contract fields, last run (outcome, time, ticket, cost), totals from existing telemetry, and a short list of planned roles with no genome shown as dormant. No new transcript reader. This is test seam 1 of the spec.

Touches `apps/bridge/snapshot.mjs` and the fixture.

## Acceptance criteria

- [ ] For a fixture root, the snapshot `crew` entry for each role has the contract, last run and totals (bridge-state style test)
- [ ] A role with no runs has an empty last run, not an error
- [ ] A noop and a clarify run show their outcome and still show cost
- [ ] Planned roles appear as dormant
- [ ] Existing snapshot keys are unchanged (the snapshot tests still pass)

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
- **orchestrator, 2026-10-03:** Parked: not a v1 den-loop step; revisit when growing the den (refocus, docs/refocus/triage-2026-10-02.md)
