# 37: Trim each genome's tools list

**Type:** chore

**Priority:** P3

**What to build:** Harness load is about 12–14k tokens per cell (ticket 36). Remove tools a cell rarely uses from `tools:` in `.claude/agents/*.md`, for example the Blender MCP tools in developer on non-asset tickets. Options: move them to an asset-only genome variant, or rely on deferred loading. Measure the first-turn context before and after.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Each genome's tools list is justified by its purpose
- [ ] First-turn context measured before and after, logged here

## Comments

- **Created (orchestrator, 2026-09-28):** From grill Q5 on ticket 04.
- **Bloat scan (scout, 2026-09-29):** 7 genomes use a bare `Agent` (architect, designer, developer, orchestrator, product, qa, security) and could name only the roles they dispatch, as herald does with `Agent(scout)`. product declares WebFetch and WebSearch but its prose sends lookups to scout. The other genomes' tools weren't checked.
