# 01: Seams design: bridge surface, snapshot, scene-from-state, app layout

**Type:** design

**Priority:** P0

**What to build:** Architect resolves the three seams in `.scratch/dimsumden-ui-v0/spec.md` as an ADR: the bridge HTTP/SSE surface (routes, event shapes), the state snapshot JSON shape, and the scene-from-state contract (`{ref, cellType, status, perch, pose}`). Also decide the `apps/ui` package and build layout (how the bridge serves the built UI, dev loop), whether metrics ride in the snapshot or come from `GET /metrics`, and list any new dependency for the user's gate.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] ADR written under `docs/adr/` covering the three seams and the app layout
- [ ] Snapshot and event shapes given as JSON examples that tickets 04-11 can test against
- [ ] New dependencies listed for the user's approval

## Comments

- **Created (orchestrator, 2026-09-29):** From `.scratch/dimsumden-ui-v0/spec.md`, breakdown approved by the user.
- **architect, 2026-09-29:** Answer: docs/adr/0011-ui-v0-seams-bridge-snapshot-scene.md (proposed). Snapshot, SSE, metrics, scene JSON shapes and app layout fixed there; deps listed in handoff for the user's gate. Handoff: handoffs/01-architect.md
- **architect, 2026-09-29:** Design done; ADR 0011 proposed, awaiting user accept and dependency gate. Orchestrator resolves.
