# 05: Chair-only decision brief

**Type:** feature

**Priority:** P2

**Blocked by:** 02, 04, organism-infra/106

**Status:** ready-for-agent

**Design refs:** ADR 0017; `.scratch/crew-dashboard/spec.md`

## What to build

The orchestrator (or architect for design questions) acts as chair alone: it reads a design-question ticket and its handoffs, writes a decision brief (question, two or three options with one recommended, benefit, cost, task count and caveat each, and 'Only you can answer'), stores it with the meeting tool, and surfaces it under Needs you as a pass gate. The chosen option becomes tickets through the normal path. First slice of ADR 0017 decision 9.

## Acceptance criteria

- [ ] A brief file has all the required sections and one recommended option (checked by a script)
- [ ] The brief appears as a Needs-you item; no ticket is created before the user decides
- [ ] The user's choice is recorded as a gate request and the orchestrator reads it
- [ ] A topic outside any role's contract ends `noop` with a reason, not a padded brief

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
