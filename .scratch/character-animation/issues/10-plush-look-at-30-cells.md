# 10: Plush look at 30 cells

**What to build:** The plush look (fuzzy, soft, no ink outlines) holds in the browser with 30 cells. It uses baked fuzz in the textures plus a rim-light shader, with no fur shells in the web build. Distant cells follow the update policy from 02's ADR.

**Priority:** P3

**Blocked by:** 02, 04

**Status:** ready-for-agent

- [ ] Baked fuzz textures and rim-light shader applied to Bao and cells
- [ ] The distant-cell update policy from 02's ADR is implemented and tested at the director seam
- [ ] A 30-cell scene holds the target frame rate (recorded in the handoff with how it was measured)
- [ ] The user confirms the look matches the renders (`ready-for-human` step)

## Comments
- **Needs main-session Blender run (orchestrator, 2026-09-26):** requires new glb clips/textures per its acceptance criteria; subagent dispatch has no Blender MCP tools. See .scratch/character-animation/handoffs/00-orchestrator-2.md.
- **Correction (main session, 2026-09-26):** The "no Blender MCP tools" note above is stale. A developer subagent dispatched from the main session has all six `mcp__blender__*` tools and read the open PandaAsset scene. Dispatch normally; the developer probes Blender before claiming.
- **unknown, 2026-09-28:** Scope changed (user, 2026-09-28): the pandas must look furry in the UI, not just fuzzy. This reverses the spec's 'no fur shells in the web build'. Now: Bao and the cells near the camera get real fur shells (about 8-12 layers, strand texture); distant cells fall back to the baked fuzz and rim light (distance LOD). Acceptance adds a performance test: 30 cells with shells on Bao and the nearest cells hold the target frame rate on the user's RTX 3060 Ti. The spec line and ADR 0006 ('baked web fur') need an update; that's a brain gate, so product or architect proposes it and the user approves.
