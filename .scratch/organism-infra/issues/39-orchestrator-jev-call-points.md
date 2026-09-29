# 39: Orchestrator genome calls Jev at two points

**Type:** chore

**What to build:** Edit .claude/agents/orchestrator.md and docs/agents: run jev.mjs before developer dispatch (tier) and before qa verify (verify), pass the Agent model override for light verify, log the jev row kind. .claude edit needs the user's permission. Design: docs/adr/0010-jev-precheck-tier-and-verify-depth.md.

**Blocked by:** 38

**Status:** resolved

- [x] Genome names both call points and the fallback
- [x] Row kind documented next to the other usage.jsonl kinds

## Comments

- **Created (orchestrator, 2026-09-28):** Follow-up of 04 (ADR 0010), published with the user's yes.
