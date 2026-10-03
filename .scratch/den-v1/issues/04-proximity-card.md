# 04: Proximity card: walk up to a panda and see who it is

**Type:** feature

**Priority:** P1

**Blocked by:** 01, 03

**Status:** ready-for-agent

**Serves:** Den loop step 3 (walk up to a panda and get its card).

## What to build

A new pure module `cardFor(scenePandas, approvals, viewer) -> Card | null` in `apps/ui/src/overlay/` picks the nearest panda within a reach radius and a facing cone of the viewer and returns its role, ticket, state, current tool, any pending approval, and the T/F/A/D capability flags (each disabled one with a reason). The overlay shows the card in walk mode. This ticket is read-only: the keys show but do nothing yet.

## Acceptance criteria

- [ ] Nearest panda in reach and facing wins; out of reach or facing away gives no card.
- [ ] A resident panda with no agent gives a card whose actions are disabled with the reason "no agent running".
- [ ] Capability flags follow the agent's runtime capabilities from the snapshot.
- [ ] `npm test` is green.

## Comments

- **Created (orchestrator, 2026-10-03):** From `.scratch/den-v1/spec.md` (ADR 0019). Keep under ~120k tokens; split rather than stretch.
