# 02: Priority module: parse, frontier order, anti-starvation bump

**Type:** feature

**Priority:** P0

**What to build:** Pure functions (e.g. `apps/organism-infra/priority.mjs`) per `.scratch/dimsumden-ui-v0/spec.md` and `docs/agents/issue-tracker.md`: parse `**Priority:** P0-P3` (missing is P2), order the frontier by effective priority then age then number, and bump a ticket one level after it has waited through 3 orchestrator handoff files (`.scratch/_handoffs/*-orchestrator-*.md`).

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] Table tests: missing line is P2, malformed line, P0 can't be bumped, bump counted from orchestrator handoffs only
- [ ] Frontier order test over a fixture board

## Comments

- **Created (orchestrator, 2026-09-29):** From `.scratch/dimsumden-ui-v0/spec.md`, breakdown approved by the user.
- **qa, 2026-09-29:** QA pass: 408 pass 0 fail 0 skipped; specify tests unchanged; both criteria covered.
