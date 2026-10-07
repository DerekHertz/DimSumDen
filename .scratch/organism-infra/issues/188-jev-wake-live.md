# 188: C: Wake check goes live

**Type:** infra

**Priority:** P3

**Serves:** Refocus goal: Jev routes each relay step, judged by bounce rate and tokens (ADR 0019; ADR 0010/0015 amendments from 136).

**What to build:** Turn the wake check live via a `config` row; any user-authored comment wakes the orchestrator; picks below 0.9 are informational only; trial judged on safety only. Touches `scripts/jev-wake-prelude.mjs`, `scripts/jev.mjs`.

**Blocked by:** 184 (B1).

**Status:** ready-for-agent

- [ ] Any user-authored comment wakes
- [ ] Below 0.9 is informational
- [ ] Safety-only trial report

## Comments

- **Created (orchestrator, 2026-10-07):** Build ticket from 136 (scopes in `handoffs/136-architect-2.md`), published with the user yes. Ranked P3, below the den-v1 path (refocus: one active feature at a time).
