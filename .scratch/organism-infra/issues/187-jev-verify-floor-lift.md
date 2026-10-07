# 187: B2: Light verify for unspecified tickets at conf 0.8

**Type:** infra

**Priority:** P3

**Serves:** Refocus goal: Jev routes each relay step, judged by bounce rate and tokens (ADR 0019; ADR 0010/0015 amendments from 136).

**What to build:** Lift the qa-unspecified floor: light verify at conf >= 0.8 with tests green and risk-check clean (risk-check runs before verify, user verdict on 136). Replay first with the 185 tool and report how many qa-unspecified tickets reach 0.8 (history: 0 of 52, max 0.74); if none, stop and ask the user about the floor. Touches `scripts/jev.mjs`.

**Blocked by:** 184 (B1), 185 (A1, replay tool).

**Status:** ready-for-agent

- [ ] Replay report of qa-unspecified tickets reaching 0.8
- [ ] Floor lifted, or a stop with the question to the user

## Comments

- **Created (orchestrator, 2026-10-07):** Build ticket from 136 (scopes in `handoffs/136-architect-2.md`), published with the user yes. Ranked P3, below the den-v1 path (refocus: one active feature at a time).
