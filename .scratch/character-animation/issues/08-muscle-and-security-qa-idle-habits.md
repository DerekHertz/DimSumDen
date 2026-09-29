# 08: Muscle + security/qa idle habits

**What to build:** The remaining four modeled cell types get their working idle habit with props, as described in `cell-types.md`: developer (music bob and sip), scout (lantern peer), security (wall stare), qa (sip and nod or pucker). Genomes for security and qa stay out of scope; only their clips and the mapping are in.

**Priority:** P2

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] The four habit clips are in the glb and pass the asset contract check
- [ ] Director tests map `working` to each type's habit
- [ ] In the scene, all seven types are distinguishable by their habit

## Comments
- **Not yet dispatchable (orchestrator, 2026-09-26):** still blocked by 07, which itself needs a main-session Blender run. See .scratch/character-animation/handoffs/00-orchestrator-2.md.
- **Correction (main session, 2026-09-26):** The "no Blender MCP tools" note above is stale. A developer subagent dispatched from the main session has all six `mcp__blender__*` tools and read the open PandaAsset scene. Dispatch normally; the developer probes Blender before claiming.
- **unknown, 2026-09-28:** Clarified (user, 2026-09-28): developer cells stay modern (a laptop, a modern look, no dynastic props). The traditional Chinese elements (scroll, hats, dynastic touches) go to the other cells. Kitchen actions like pleating can still apply, but with a modern style.
