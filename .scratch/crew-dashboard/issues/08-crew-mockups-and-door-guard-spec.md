# 08: Designer spec and mockups: Crew view, door guard, meeting panel

**Type:** design

**Priority:** P3

**Blocked by:** 03

**Status:** ready-for-agent

**Design refs:** `.scratch/crew-dashboard/spec.md`, the video write-up in the spec's Source

## What to build

The designer writes a UI spec and mockups for the Crew view (role card, Next-up strip, phone list, Demo mode), the Front of House door-guard skin on Needs you, and the meeting screens (setup, transcript, brief, rejoin). Mockups are approved by the user before any visual code. Takes the video's findings as input: responsibility before character, hover cards, merged tool labels, cost beside the result.

## Acceptance criteria

- [ ] Spec and mockups cover the Crew view at 1440 and 375 widths, both themes, reduced motion
- [ ] Door-guard look is specified with no new data or approval path
- [ ] Meeting panel and decision-brief view are specified
- [ ] The user has given a verdict on the mockups (`human-verified`)

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
