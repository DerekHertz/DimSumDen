# 68: S1: Tier and verify exit review (ADR 0010)

**Type:** review

**Priority:** P1

**What to build:** Judge Jev's two existing points against ADR 0010's exit criteria and record a verdict for each (live, stay shadow, or drop). Blocks nothing in shadow; it gates S5 (via the jg route) and S6.

Source: `.scratch/organism-infra/spec.md`, ADR 0015.

**Blocked by:** None

**Status:** ready-for-agent

- [ ] Orchestrator judges the 2 bounces per point from the handoffs and records tier and verify verdicts (live, stay shadow, or drop) with the current numbers as the baseline (tier: 24 tickets, 3 fallbacks, +11.7% tokens; verify: 20 tickets, 0 fallbacks, -5.5% tokens, median about 450 ms).
- [ ] `jev-report.mjs` output supports the verdict without hand computation.
- [ ] The verdict is recorded on the board; any live switch needs the user's yes.

## Comments
