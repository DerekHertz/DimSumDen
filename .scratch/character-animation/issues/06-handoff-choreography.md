# 06: Handoff choreography

**Priority:** P2

**What to build:** A handoff is visible. The sender plays point, a qi bead travels the pathway (per the existing Signaling spec in the design system), and the receiver plays look-up with a heart bubble. No cell leaves its perch.

**Priority:** P2

**Blocked by:** 04, 14

**Status:** ready-for-agent

- [ ] point and look-up clips are in the glb and pass the asset contract check
- [ ] Director tests cover the handoff sequence and that no perch changes
- [ ] In the scene, a mock handoff event between two cells plays the full choreography
- [ ] Reduced motion keeps the information (bead and bubble) without loops

## Comments
- **Needs main-session Blender run (orchestrator, 2026-09-26):** requires new glb clips/textures per its acceptance criteria; subagent dispatch has no Blender MCP tools. See .scratch/character-animation/handoffs/00-orchestrator-2.md.
- **Correction (main session, 2026-09-26):** The "no Blender MCP tools" note above is stale. A developer subagent dispatched from the main session has all six `mcp__blender__*` tools and read the open PandaAsset scene. Dispatch normally; the developer probes Blender before claiming.
- **Scope change (user, 2026-09-29):** banquet market layout. The handoff is now the lazy susan turning the dish to the next stall; the sender still points and the receiver still looks up with a heart bubble. The qi bead and dumpling tray are dropped. Now also blocked by 14. Canvas: https://claude.ai/artifact/LQjpimx1jfX5bjZEoTo3za
