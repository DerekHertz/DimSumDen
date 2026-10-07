# 189: D: Priority and scope flags beside frontier proposals

**Type:** infra

**Priority:** P3

**Serves:** Refocus goal: Jev routes each relay step, judged by bounce rate and tokens (ADR 0019; ADR 0010/0015 amendments from 136).

**What to build:** Advisory mode: Jev priority and scope flags shown at the frontier proposal, never feeding the order; report the promotion bars (70% over 10 flags; 60% tercile over 20; no small ticket in the top tercile). Touches `scripts/jev.mjs`.

**Blocked by:** 184 (B1).

**Status:** ready-for-agent

- [ ] Flags shown beside proposals and do not change the order
- [ ] Promotion-bar report

## Comments

- **Created (orchestrator, 2026-10-07):** Build ticket from 136 (scopes in `handoffs/136-architect-2.md`), published with the user yes. Ranked P3, below the den-v1 path (refocus: one active feature at a time).
