# 191: G: Extend ADR 0010 decision 9 for the next Jev uses

**Type:** design

**Priority:** P3

**Serves:** Refocus goal: Jev routes each relay step, judged by bounce rate and tokens (ADR 0019; ADR 0010/0015 amendments from 136).

**What to build:** Architect extends ADR 0010 decision 9 in writing for 74 criteria (escalate-only done-check), bounce routing, handoff trimming and diff input, after the user rules on 42 (retention, handoffs and diffs). Carry 42 security conditions (`scripts/exposure.mjs` pattern and per-file deny gaps, diff scope) into build tickets. Touches `docs/adr/0010-jev-precheck-tier-and-verify-depth.md`.

**Blocked by:** 42 (and the user decisions it raised).

**Status:** ready-for-agent

- [ ] ADR 0010 decision 9 extended for each use, or a recorded no
- [ ] 42 exposure conditions filed as build tickets

## Comments

- **Created (orchestrator, 2026-10-07):** Build ticket from 136 (scopes in `handoffs/136-architect-2.md`), published with the user yes. Ranked P3, below the den-v1 path (refocus: one active feature at a time).
