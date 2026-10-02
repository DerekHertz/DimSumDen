# 13: Real autonomy control (bridge endpoint + UI)

**Type:** feature

**Priority:** P2

**Blocked by:** den-scene-v1/07-sidebar-overlays

**Status:** needs-triage

## What to build

The intent bar in 07 shows an autonomy chip, but the repo has no autonomy control or bridge endpoint, so it can't change anything. The user wants the real control (2026-10-02): a bridge endpoint that reads and sets the relay's autonomy mode, and the chip in the intent bar wired to it. Open requirements for `product`: which modes exist (e.g. manual / relay autonomy / autopilot), what each changes in the orchestrator loop, who may set it, and where the state lives. Then `architect` for the endpoint and its test seam. Expect security review (it changes what runs without a gate).

Files: `apps/bridge/`, `apps/ui/` (intent bar chip), orchestrator genome (user-gated) if modes change the loop.

## Acceptance criteria

- [ ] Product spec settles the modes and their meaning
- [ ] Bridge endpoint reads and sets the mode, with tests
- [ ] The 07 chip reflects and changes the mode; no "coming soon" state remains

## Comments
- **orchestrator, 2026-10-02:** Split out of 07 by the user ("New ticket, 07 waits"). Until this lands, 07's chip is disabled with a "coming soon" tooltip.
- **orchestrator, 2026-10-02:** From the 07 designer re-review (N2, low): the 0.55 dim puts the "Gated" chip text at about 3.4:1. When building the real control, dim only the dot and border and keep the text at full ink.
