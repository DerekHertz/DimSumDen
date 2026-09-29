# 05: Travel between perches

**Priority:** P2

**What to build:** Cells move between any two perches without hand-authored routes. The director computes a procedural path between perch anchors. It hops in arcs when the destination is on a different body region (crown, shoulder, knee, grass) and waddles along the surface when it is on the same region. A state change mid-travel reacts immediately. A cell that is airborne mid-hop drops to the nearest surface point on Bao or the grass, plays land-squish, and takes that point as its new perch. With reduced motion, travel becomes a `dur-base` cross-fade at the destination.

**Priority:** P3

**Blocked by:** 04, 14

**Status:** ready-for-agent

- [ ] hop, waddle and land-squish clips are in the glb and pass the asset contract check
- [ ] Director tests cover hop vs waddle choice, the mid-hop drop, and the reduced-motion cross-fade
- [ ] In the scene, a cell can be sent to any perch and travels there correctly

## Comments
- **Needs main-session Blender run (orchestrator, 2026-09-26):** requires new glb clips/textures per its acceptance criteria; subagent dispatch has no Blender MCP tools. See .scratch/character-animation/handoffs/00-orchestrator-2.md.
- **Correction (main session, 2026-09-26):** The "no Blender MCP tools" note above is stale. A developer subagent dispatched from the main session has all six `mcp__blender__*` tools and read the open PandaAsset scene. Dispatch normally; the developer probes Blender before claiming.
- **Scope change (user, 2026-09-29):** banquet market layout. Travel is now cub basket to stall, stall to table, and hops onto Bao's crown and shoulders for the 3 Pass cells only. Paths come from ADR 0013's anchors. Now also blocked by 14. Canvas: https://claude.ai/artifact/LQjpimx1jfX5bjZEoTo3za
