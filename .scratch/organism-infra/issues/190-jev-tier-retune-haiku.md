# 190: E: Tier retune with a small tier and Haiku 5.5

**Type:** infra

**Priority:** P3

**Serves:** Refocus goal: Jev routes each relay step, judged by bounce rate and tokens (ADR 0019; ADR 0010/0015 amendments from 136).

**What to build:** Re-derive tier labels and thresholds from the 98 shadow rows; add `small`; Haiku 5.5 (`claude-haiku-5-5`) may take developer work on `small` at conf >= 0.8, checked by replay (185 tool); one Haiku bounce turns lowering off; light verify on Haiku (overlaps 40, which this absorbs); check the Haiku 5.5 price against weight 0.5. Touches `scripts/jev.mjs`. Likely over 120k: split before dispatch if the size check says so.

**Blocked by:** 184 (B1), 185 (A1, replay tool).

**Status:** ready-for-agent

- [ ] Thresholds re-derived from shadow rows, `small` added
- [ ] Replay result for Haiku on `small`
- [ ] One Haiku bounce turns lowering off
- [ ] Haiku price checked against weight 0.5

## Comments

- **Created (orchestrator, 2026-10-07):** Build ticket from 136 (scopes in `handoffs/136-architect-2.md`), published with the user yes. Ranked P3, below the den-v1 path (refocus: one active feature at a time).
