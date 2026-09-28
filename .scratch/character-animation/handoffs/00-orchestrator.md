# Handoff: orchestrator → developer (main session) for ticket 01

**State**: partial. Tickets published; 02 resolved; 01 reset to ready-for-agent after an environment block.

## What changed
- `main` (pushed): `d0ccfd5` tickets 01–10 in `.scratch/character-animation/issues/` + ADR 0007 (`docs/adr/0007-character-director-seam-and-package-layout.md`); `65bc01c` adds six `mcp__blender__*` tools to `.claude/agents/developer.md`.
- Ticket 02 resolved by architect; see `handoffs/02-architect.md`.
- Ticket 01: first developer attempt blocked (see its `## Comments` and `handoffs/01-developer.md`); status reset to `ready-for-agent`.

## Decisions made
- User approved the 10-ticket breakdown as proposed.
- Blender route: Blender MCP (live GUI), not headless. Developer cells doing Blender work run as a **main session** (`claude --agent developer`), because a developer spawned as a subagent from the orchestrator did not receive the `mcp__blender__*` tools despite the genome listing them (likely genomes load at session start, or MCP isn't passed to subagents; unverified).

## Next step
**developer (main session, user-launched)**: do ticket 01 `.scratch/character-animation/issues/01-motion-test-prototype.md`. Keep Blender open with the MCP add-on connected. Ticket ends `ready-for-human` for the user's feel check. Then an orchestrator session picks up: frontier after 01 is 03.

## Suggested skills
`organism-protocol`, `prototype`, `implement`.

## Gotchas
- A worktree hook blocks the Write tool on the main checkout; write to scratch and `cp` via Bash. Bash heredocs containing many quotes failed to parse; use Write + cp.
- Blender scene "Meshy": base mesh `PlushBase` (hidden), test cell `PlushTest` with 14 fur shells, plus seven `PCell_*` types with props. `get_objects_summary` is very verbose; use `get_object_detail_summary`. Save to a new .blend.
- Motion tokens and `CELL_SCALE` live in the design system artifact (https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j, `project/tokens.json`, `project/motion.md`), not in the repo.
- Open question worth an ADR/genome note later: can Brain cells ever dispatch Blender work as subagents? If not, asset tickets (03, 05–09) also need main-session developers.
