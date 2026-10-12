# 06: Retire the old frontier order

**Type:** code

**Priority:** P1

**Class:** product

**Origin:** spec

**Blocked by:** 02

**Status:** in-review

**Serves:** `.scratch/queue/spec.md` decisions 1, 14; ADR 0015 Amendment 3 (the order leaves `jev.mjs`).

## What to build

One order only: the Queue from ticket 02. Design: ADR 0015 Amendment 3 and `.scratch/queue/handoffs/01-architect.md` (Q5).

- Remove `rankFrontier`, `orderRow` and the `order` CLI entry from `scripts/jev.mjs`, with their tests in `scripts/jev-order.test.mjs` and `scripts/jev-scope.test.mjs`.
- Drop the aging bump from `apps/organism-infra/priority.mjs`. Check its callers first: the UI snapshot builder used it.
- Switch the `proposed` order in `scripts/queue.mjs` to `buildQueue`.
- Update the Frontier paragraph of `docs/agents/issue-tracker.md`.
- Existing `jev-order` rows stay in `usage.jsonl` as history; nothing reads them.

## Acceptance criteria

- [ ] `node scripts/jev.mjs order` exits 2 as an unknown command, and no code calls `rankFrontier` or `orderRow`.
- [ ] `scripts/queue.mjs` prints its ready list in `buildQueue` order.
- [ ] No caller of `priority.mjs` depends on the aging bump; the UI snapshot still builds.
- [ ] The handoff lists every reader of `jev-order` rows found by a full-repo search (the architect searched only `scripts/`, `apps/` and `.claude/agents/`).
- [ ] `docs/agents/issue-tracker.md` describes the Queue order.
- [ ] `npm test` passes.

## Comments

- **orchestrator, 2026-10-12:** published from the architect's breakdown (Q5) on the user's approval. Its files do not overlap tickets 03 or 04. The orchestrator genome still names `jev.mjs order` until ticket 07 is applied; an orchestrator that hits the removed command logs nothing and carries on.
