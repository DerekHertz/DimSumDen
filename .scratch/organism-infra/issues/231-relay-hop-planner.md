# 231: Relay hop planner (pure) and the shared hop table

**Type:** feature

**Priority:** P1

**Status:** ready-for-agent

**Source:** architect

**Class:** product

**Origin:** added

**Blocked by:** none

**Serves:** Den loop: the den can say which agent a ticket needs next (ADR 0022 decisions 1 and 2).

## What to build

Slice 1, ticket A of ADR 0022 (`docs/adr/0022-relay-through-the-bridge.md`, accepted by the user 2026-10-12).

`apps/bridge/relay/plan.mjs` exporting `nextHop(facts)` as ADR 0022 decision 1 defines it, plus `readFacts(root, ref)` beside it. Move the `SPECS` table of `scripts/dispatch-prompt.mjs` (style, release, context, handoff stem, modes) into a data module both import; `dispatch-prompt.mjs` output must not change byte for byte.

`nextHop` is pure: no fs, no clock, no spawn. Its rules are the table in decision 1: a frontier code ticket starts with developer (the user's answer to decision 3: developer test-first for a den-started relay); developer in-review goes to qa verify light; qa pass goes to the risk step; bounces; the second bounce stops; a partial retries once; designer and product are a `needs-you` stop.

`readFacts` reads status, type, holder and handoff State blocks through the board service, the verdicts the bounce count reads, and the bridge's `sessions.jsonl` `end` rows.

## Acceptance criteria

- [ ] A table test maps facts to hops for every row of decision 1, including the stop rows.
- [ ] `nextHop` returns a stop, never a hop, for a ticket with a live agent, a blocked ticket and an unknown type.
- [ ] A test shows base sha and branch come from `end` rows and that handoff text naming another sha is ignored.
- [ ] `dispatch-prompt.mjs` output is unchanged for every cell and mode (existing tests green) and it imports the shared table.
- [ ] `npm test` green.

## Expected files

`apps/bridge/relay/plan.mjs`, `apps/bridge/relay/facts.mjs`, `scripts/hop-table.mjs` (or beside the planner), `scripts/dispatch-prompt.mjs`, tests beside each.

## Comments

- 2026-10-12, orchestrator: filed from the architect's draft in `.scratch/organism-infra/handoffs/229-architect.md` after the user accepted ADR 0022. Shares no files with organism-infra/230, so it can run beside it.
