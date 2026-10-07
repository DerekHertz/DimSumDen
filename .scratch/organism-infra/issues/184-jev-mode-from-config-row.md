# 184: B1: Jev reads each use case mode from its latest config row

**Type:** infra

**Priority:** P3

**Serves:** Refocus goal: Jev routes each relay step, judged by bounce rate and tokens (ADR 0019; ADR 0010/0015 amendments from 136).

**What to build:** `scripts/jev.mjs` resolves each use case mode (shadow, advisory, live) from its latest `config` row in `.scratch/usage.jsonl`; `decide` already receives `usageRows`. Add a regression test that `effective` equals today rule in every mode and every fallback reason. Touches `scripts/jev.mjs`, `scripts/jev.test.mjs`.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A `config` row switches a use case mode with no code edit
- [ ] Regression test: `effective` equals today rule in every mode and fallback reason

## Comments

- **Created (orchestrator, 2026-10-07):** Build ticket from 136 (scopes in `handoffs/136-architect-2.md`), published with the user yes. Ranked P3, below the den-v1 path (refocus: one active feature at a time).
