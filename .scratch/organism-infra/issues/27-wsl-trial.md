# 27: Trial running the organism from WSL Ubuntu

**Type:** task

**What to build:** A measured go/no-go on moving the organism from Windows to WSL2 Ubuntu. Most incidents in `.scratch/usage.jsonl` are Windows-specific: rm/cp prompts, heredoc parsing, PowerShell BOMs, CRLF warnings, npm shims. Linux-first tools (jevgrep, Ollama) run natively there.

1. Clone the repo into the Ubuntu filesystem (`~/`), not `/mnt/c`. Run `npm ci` and `npm test`.
2. Run the `claude` CLI there with `--agent orchestrator`. Check that skills, agents and the board CLI work, and whether the desktop app can host WSL sessions.
3. Check Blender MCP from WSL against Windows Blender (localhost across WSL2 networking).
4. List the hardcoded Windows paths in docs, tickets and tests that need changing.
5. Compare against the Windows incident classes: run one small ticket's relay there and log incidents.

**Blocked by:** None. The move itself is a user decision after the trial.

**Status:** resolved

- [x] `npm test` passes in a WSL-native clone
- [x] Orchestrator session runs one relay end to end in WSL, with incidents logged
- [x] Blender MCP and desktop-app support: both work (see comments)
- [x] Go/no-go recommendation with a migration checklist

## Comments

- **Created (orchestrator, 2026-09-28):** at the user's request. jevgrep is installed in WSL (`~/.agents/skills/jevgrep`, symlinked into WSL's `~/.claude`), so a WSL-hosted Claude gets it natively.
- **Progress (orchestrator, 2026-09-28, session 5):** `npm test` 210/210 in `~/dimsumden` after the Playwright deps were installed. Orchestrator session runs from the desktop app's Code tab against WSL, so the desktop app can host WSL sessions. Windows-only work was synced in 5c7ce80.
- **Note (orchestrator, 2026-09-28):** TypeSafe plugin installed in WSL at user level with `claude plugin marketplace add` and `claude plugin install`. Plugins install from Bash without the interactive `/plugin` UI.
- **Relay log (orchestrator, 2026-09-28, session 5):** ticket 24 ran qa specify → developer → qa verify → security (bounced) in WSL. Zero Windows-class incidents (no prompts, CRLF, path, npm shim issues). Friction: isolation guard rejects compound/chained or runtime-computed commands (genuine); `ORGANISM_ROOT` unset in cells; review claims clobber `in-review` status.
- **orchestrator, 2026-09-28:** Blender MCP works from WSL: official Blender Lab bundle (blender-1.0.3.mcpb) unpacked to ~/.local/share/blender-mcp-1.0.3, registered as 'blender' via uv run; reaches the Windows add-on on localhost:9876 with networkingMode=mirrored. The community uvx blender-mcp speaks a different protocol and hangs.
- **Decision (user, 2026-09-28): GO, move the organism to WSL.** Evidence: 8 cell runs (ticket 24 relay incl. a security bounce) with zero Windows-class incidents; tests, jevgrep, TypeSafe, Blender MCP and desktop-app hosting all work. Migration checklist:
  1. Retire the Windows checkout (synced in 5c7ce80); work only in `~/dimsumden`.
  2. Windows-specific docs to revise: `organism-protocol` Shell section (PowerShell BOM, rm/cp prompt notes), `docs/agents/process-hygiene.md` (PowerShell node-kill recipe), `design-brief.md:171` (`D:\web_downloads\panda` → `/mnt/d/...` or copy into repo). Test comments about `cmd.exe` are cross-platform and stay.
  3. Ticket 29: set `ORGANISM_ROOT` at dispatch.
  4. New ticket: cell worktrees start at `main`, not the previous hop's commit; dispatch should base them on it.
  5. Keep `%UserProfile%\.wslconfig`: memory=12GB, processors=8, networkingMode=mirrored (Blender MCP needs mirrored).
  6. Blender MCP: official Blender Lab bundle at `~/.local/share/blender-mcp-1.0.3`, user-scope `blender` server via `uv run`. Never the community `uvx blender-mcp`.
