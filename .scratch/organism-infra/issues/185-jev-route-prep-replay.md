# 185: A1: Route prep and replay on labelled history

**Type:** infra

**Priority:** P3

**Serves:** Refocus goal: Jev routes each relay step, judged by bounce rate and tokens (ADR 0019; ADR 0010/0015 amendments from 136).

**What to build:** Normalize advisory-outcome aliases (`qa`=`qa-specify`, `developer`=`developer-direct`); add a `security` label; build the `state` header in code (Type, files touched, gated-path flags, relay defaults); sharper criteria text; an atomic yes/no version composed in code. Build a replay tool (reused by 187 and 190) and replay both versions on the 39 labelled tickets. Touches `scripts/jev.mjs`, a new replay script under `scripts/`. Scopes from `.scratch/organism-infra/handoffs/136-architect-2.md` item A. Likely over 120k: split before dispatch if the size check says so.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Aliases normalized and `security` label accepted
- [ ] State header built in code
- [ ] Replay report: agreement % for each version on the 39 labelled tickets

## Comments

- **Created (orchestrator, 2026-10-07):** Build ticket from 136 (scopes in `handoffs/136-architect-2.md`), published with the user yes. Ranked P3, below the den-v1 path (refocus: one active feature at a time).
