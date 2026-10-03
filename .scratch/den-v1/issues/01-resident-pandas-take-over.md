# 01: Resident pandas, take-over and split-off

**Type:** feature

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** Den loop step 1 (the den is always populated; a running agent takes over its role's panda).

## What to build

`sceneFromState(snapshot)` in `apps/ui/src/scene/scene-from-state.mjs` returns one resident entry per role, always, placed at its station. A live agent in the snapshot's `agents` list (ADR 0016 decision 4, named `agents` under ADR 0019 decision 10; use a fixture until 106 lands) binds to its role's resident entry, which then carries the agent's id, state, ticket and latest tool. A second live agent of the same role becomes a split-off entry beside the resident one; when an agent ends, its binding (or split-off entry) goes. The renderer in `apps/ui/src/scene/` draws resident, taken-over and split-off pandas from the existing frozen glbs, with taken-over state shown by shape or icon as well as colour. Pure module first; no three, React or DOM in the model.

## Acceptance criteria

- [ ] With no agents running, the scene has exactly one resident panda per role.
- [ ] One live developer binds to the developer panda; a second live developer adds one split-off panda; ending either removes only its own binding.
- [ ] Each state (working, waiting on user, blocked, failed, done) maps to a distinct shape or icon, not colour alone.
- [ ] `npm test` is green.

## Comments

- **Created (orchestrator, 2026-10-03):** From `.scratch/den-v1/spec.md` (ADR 0019). Keep under ~120k tokens; split rather than stretch.
