# 09: Trim the tool definitions every cell carries

**Type:** task

**What to build:** Cut the tool definitions loaded into every Agent Office session and cell. Today a session carries about 16k tokens of MCP tool definitions and about 31k of built-in tool definitions on every turn. Most of the MCP ones don't serve this project: Gmail, Drive, Calendar, Chrome, computer-use, Figma, the job-search connector, and unauthenticated design and engineering plugins.

Keep the tools cells actually use: Blender for the developer and designer, and the Browser pane for the designer. Say where each setting lives (project `.claude/settings.json`, per-genome `tools:` lists, or the user's claude.ai connector settings) and who changes it.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Measure the token cost of a session's tools before and after (`get_usage` context categories)
- [x] Project-level settings disable the unused MCP servers and plugins; the Blender and Browser tools still work for the cells that need them
- [x] Settings and genome changes are proposed to the user before editing (brain gate); connector changes on claude.ai are the user's to make

## Comments

- **Created (orchestrator, 2026-09-27):** At the user's request, to save tokens on the Pro plan.
- **Orchestrator (2026-09-27):** User approved the proposal. Added project `.claude/settings.json`: `ENABLE_CLAUDEAI_MCP_SERVERS=false` plus `permissions.deny` for chrome, computer-use, scheduled-tasks, mcp-registry and the design/engineering plugin servers; Blender and the Browser pane kept. Baseline (desktop session, 2026-09-27): MCP tools 16.8k, system tools 31.0k. `claude -p "/context"` can't measure it (no slash commands in print mode, and the CLI doesn't load the desktop app's servers). Pending: after-measurement in a fresh desktop session via `get_usage`, plus a Blender and a Browser smoke call.
- **Orchestrator (2026-09-27):** After-measurement in a fresh desktop session: MCP tools 15.9k (from 16.8k), system tools unchanged. `deny` blocks calls but doesn't unload definitions; the claude.ai-connector env var had no visible effect. The user chose to keep the file as a guardrail and close the ticket. PR #11 is open; resolve after merge.
- **Resolved (orchestrator, 2026-09-27):** PR #11 merged by the user. Lock released.
