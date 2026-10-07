# 186: A2: Route goes live behind a config row, then a 10-ticket trial

**Type:** infra

**Priority:** P3

**Serves:** Refocus goal: Jev routes each relay step, judged by bounce rate and tokens (ADR 0019; ADR 0010/0015 amendments from 136).

**What to build:** Take the A1 winner live only if it reached 80% agreement, via a `config` row; then run a 10-ticket trial and report bounce rate and tokens. If below 80%, record that and stop. Touches `scripts/jev.mjs`, `.scratch/usage.jsonl`.

**Blocked by:** 184 (B1), 185 (A1).

**Status:** ready-for-agent

- [ ] Live only at >= 80% replay agreement, else a recorded stop
- [ ] 10-ticket trial report: bounce rate and tokens

## Comments

- **Created (orchestrator, 2026-10-07):** Build ticket from 136 (scopes in `handoffs/136-architect-2.md`), published with the user yes. Ranked P3, below the den-v1 path (refocus: one active feature at a time).
