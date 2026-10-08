# 125: Remove Blender and the 3D asset sources

**Type:** task

**Priority:** P2

**Blocked by:** 116 (it removes the Blender MCP tools and designer critique mode from the role files in its patch)

**Status:** ready-for-agent

**Serves:** ADR 0019 decision 7 (Blender leaves the repo; glbs frozen; new visuals are procedural three.js).

## What to build

Tag the current `main` as `pre-refocus` (the user pushes the tag), then remove: `design/3d/` (160 MB of Blender scripts, .blend files and renders), `apps/ui/assets-src/` (the Blender build scripts for the panda glb), the `asset-critique` skill under `.claude/skills/asset-critique/` (gated), Blender references in `.codex/agents/*.toml`, `design-brief.md`, `.gitignore` and `docs/`. The exported glbs and textures under `apps/ui/public/` stay exactly as they are, and every test that loads them still passes. Anything that imported from the removed folders (a contract check, a fixture) is either pointed at the frozen glb or deleted with a note.

## Acceptance criteria

- [ ] `git grep -il blender -- ':!.scratch' ':!docs/adr'` returns only ADR-style history notes listed in the handoff.
- [ ] `design/3d/` and `apps/ui/assets-src/` are gone; `apps/ui/public/` is byte-identical to before.
- [ ] `npm test` and `npm run smoke:ui` are green.
- [ ] The gated `.claude/skills/asset-critique/` removal ships as a patch for `npm run apply-gated`.

## Comments

- **Created (orchestrator, 2026-10-03):** Refocus session (ADR 0019, docs/refocus/triage-2026-10-02.md).
- **orchestrator, 2026-10-03:** The exported glbs no longer need to stay frozen: after PR #151 nothing live loads them, and den-v1/08 removes them with the market scene. This ticket keeps the Blender sources, the asset-critique skill and the Blender references.
- **orchestrator, 2026-10-08:** User 2026-10-08: lowered to P2 while 116 stays parked, so the P1 list is only the north star path.
