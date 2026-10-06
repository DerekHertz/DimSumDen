# 160: Jev verify shadow logs the wrong baseline after qa specify

**Type:** bug

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** resolved

**Serves:** Jev shadow accuracy (ADR 0010). Incident 2026-10-06T16:57 (usage.jsonl, tool `jev.mjs verify`).

## What to build

`node scripts/jev.mjs verify --ticket <ref> --tests <file>` in shadow mode must report `effective` equal to today's relay rule: `light` when qa ran `specify` for the ticket, `full` otherwise. On organism-infra/158 (qa specify handoff published) it reported `effective: full`, so its shadow rows compare Jev against the wrong baseline. Find how `scripts/jev.mjs` decides today's rule and fix it.

## Acceptance criteria

- [ ] Shadow verify reports `effective: light` for a ticket with a published qa specify handoff (test with a fixture board)
- [ ] It reports `effective: full` for a ticket without one (test)

## Comments

- **orchestrator, 2026-10-06:** Filed from the pipeline retro (user yes, 2026-10-06).
- **orchestrator, 2026-10-06:** Retro: recurred on den-layout/04 (shadow verify said full after qa specify). P3 → P1 and ahead of 145/147 in the infra queue (user, 2026-10-06).
- **qa, 2026-10-06:** All 2126 tests pass, 9 new tests green, both criteria covered, no test changes since specify, only scripts/jev.mjs modified (in scope).
- **security, 2026-10-06:** Security pass at aad879a. No findings (critical to low). risk-check hits are benign: spawnSync of node with fixed argv, no shell, fixture board in a tmpdir. gitleaks clean. No dep/workflow changes. Detail: handoffs/160-security.md
