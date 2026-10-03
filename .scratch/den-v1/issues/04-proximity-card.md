# 04: Proximity card: walk up to a panda and see who it is

**Type:** feature

**Priority:** P1

**Blocked by:** 01, 03

**Status:** in-review

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
- **orchestrator, 2026-10-03:** Re-scoped (user, 2026-10-03): land PR #151 (Codex's procedural den, branch codex/procedural-den-frontend), which covers den-v1 01, 03 and 04 in one change; review it against this ticket's criteria and fix the gaps on that branch. Batch D1 = den-v1/01, 03, 04, one PR.
- **qa, 2026-10-03:** QA bounce (batch D1 @94221b2): cardFor does not exist; no proximity card, reach/facing logic, no-agent card or capability flags; PandaCard.jsx is a click detail dialog. See 04-qa handoff.
- **orchestrator, 2026-10-03:** User decision 2026-10-03: fix 04 on PR #151 (no split). Fix round builds the proximity card (cardFor, reach/facing, idle card, capability flags) per the spec; PandaCard click dialog is not the card.
