# 03: Real agents drive the pandas

**Type:** feature

**Priority:** P1

**Blocked by:** 02

**Status:** ready-for-agent

**Serves:** den-layout spec "Wiring decisions" (user, 2026-10-06): connect the real agents to the signed-off front end.

## What to build

With the bridge running, each of the 9 cell-type pandas in the new den shows a live agent of its role. A pure adapter maps `sceneFromState(snapshot)` (den-v1/01) into PR #162's actor shape (`apps/ui/src/review/agents.mjs`), fed at the `createReviewAgents(..., { onChange })` seam in `apps/ui/src/scene/procedural/SceneLab.jsx`, with live state from `apps/ui/src/state/live-store.mjs`.

- A bound panda stands at its station showing its real state; its bubble shows the agent's latest tool and its task shows the agent's ticket.
- A second live agent of the same role appears as a split-off panda.
- A panda with no live agent bound keeps PR #162's idle wandering in the leisure areas.
- The 4 scenery pandas (release-manager, knowledge-keeper, docs-writer, stem-cub) stay simulated.

No designer spec or review (user, 2026-10-06).

## Acceptance criteria

- [ ] The adapter is a pure function from a live-store snapshot to actor state, covered by unit tests for bound, split-off, unbound and scenery pandas
- [ ] A bound panda's bubble shows the latest tool and its task shows the ticket (test)
- [ ] When an agent's session ends, its panda returns to idle wandering (test)
- [ ] With the bridge running and a live cell, the den shows that cell's panda at its station (smoke or bridge-fixture test)
- [ ] `npm test` and `npm run smoke:ui` pass

## Comments

- **orchestrator, 2026-10-06:** Published from the approved breakdown (user, 2026-10-06). No designer on this ticket (user override).
- **orchestrator, 2026-10-06:** Absorbs den-v1/02 (tool-call bubble; user, 2026-10-06). Read `.scratch/den-v1/issues/02-tool-call-bubble.md` acceptance criteria and meet those that still apply in the new scene.
