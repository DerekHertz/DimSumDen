# 09: Bao's ambient life

**What to build:** Bao feels alive but calm. Bao uses the shared rig at 11x scale. Its belly breathes slowly all the time, its head drifts in a slow sway, and it blinks occasionally. While any approval waits, Bao glances toward the Approval Inbox. After the organism has been idle for a while it yawns once, then dozes if it stays idle. With reduced motion, Bao holds still.

**Priority:** P1

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Bao-only clips (head sway, yawn, doze) and the inbox look-at target are in place and pass the asset contract check
- [ ] Director tests cover the inbox glance trigger, idle yawn then doze, and the calm rule spacing
- [ ] In the scene, a mock pending approval makes Bao glance at the inbox position

## Comments
- **Needs main-session Blender run (orchestrator, 2026-09-26):** requires new glb clips/textures per its acceptance criteria; subagent dispatch has no Blender MCP tools. See .scratch/character-animation/handoffs/00-orchestrator-2.md.
- **Correction (main session, 2026-09-26):** The "no Blender MCP tools" note above is stale. A developer subagent dispatched from the main session has all six `mcp__blender__*` tools and read the open PandaAsset scene. Dispatch normally; the developer probes Blender before claiming.
- **Update (user, 2026-09-29):** Bao glances at the service bell on the Pass rail and at any lit stall lantern, not the Approval Inbox position.
