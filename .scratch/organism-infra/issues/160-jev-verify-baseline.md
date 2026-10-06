# 160: Jev verify shadow logs the wrong baseline after qa specify

**Type:** bug

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** Jev shadow accuracy (ADR 0010). Incident 2026-10-06T16:57 (usage.jsonl, tool `jev.mjs verify`).

## What to build

`node scripts/jev.mjs verify --ticket <ref> --tests <file>` in shadow mode must report `effective` equal to today's relay rule: `light` when qa ran `specify` for the ticket, `full` otherwise. On organism-infra/158 (qa specify handoff published) it reported `effective: full`, so its shadow rows compare Jev against the wrong baseline. Find how `scripts/jev.mjs` decides today's rule and fix it.

## Acceptance criteria

- [ ] Shadow verify reports `effective: light` for a ticket with a published qa specify handoff (test with a fixture board)
- [ ] It reports `effective: full` for a ticket without one (test)

## Comments

- **orchestrator, 2026-10-06:** Filed from the pipeline retro (user yes, 2026-10-06).
- **orchestrator, 2026-10-06:** Retro: recurred on den-layout/04 (shadow verify said full after qa specify). P3 → P1 and ahead of 145/147 in the infra queue (user, 2026-10-06).
