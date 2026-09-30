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
- **orchestrator, 2026-09-30:** Verdicts (orchestrator, 2026-09-30, evidence from scout): tier STAY SHADOW: 24 tickets, 3 fallbacks, median 436 ms, 2 bounces (dimsumden-ui-v0/07, organism-infra/41), neither caused or avoidable by the pick; value fails (+11.7% tokens vs -30% needed). verify STAY SHADOW: 20 tickets, 0 fallbacks, median 468.5 ms, same 2 bounces unrelated to depth; value fails (-5.5% vs -30%). No live switch. Criterion 2 NOT met: jev-report prints bounces but not their cause or a per-criterion PASS/FAIL, so the safety judgement needed hand reading. Ticket stays open until jev-report prints that.
