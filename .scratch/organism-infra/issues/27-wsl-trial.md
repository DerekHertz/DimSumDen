# 27: Trial running the organism from WSL Ubuntu

**Type:** task

**What to build:** A measured go/no-go on moving the organism from Windows to WSL2 Ubuntu. Most incidents in `.scratch/usage.jsonl` are Windows-specific: rm/cp prompts, heredoc parsing, PowerShell BOMs, CRLF warnings, npm shims. Linux-first tools (jevgrep, Ollama) run natively there.

1. Clone the repo into the Ubuntu filesystem (`~/`), not `/mnt/c`. Run `npm ci` and `npm test`.
2. Run the `claude` CLI there with `--agent orchestrator`. Check that skills, agents and the board CLI work, and whether the desktop app can host WSL sessions.
3. Check Blender MCP from WSL against Windows Blender (localhost across WSL2 networking).
4. List the hardcoded Windows paths in docs, tickets and tests that need changing.
5. Compare against the Windows incident classes: run one small ticket's relay there and log incidents.

**Blocked by:** None. The move itself is a user decision after the trial.

**Status:** ready-for-agent

- [ ] `npm test` passes in a WSL-native clone
- [ ] Orchestrator session runs one relay end to end in WSL, with incidents logged
- [ ] Blender MCP and desktop-app support: works / doesn't, with notes
- [ ] Go/no-go recommendation with a migration checklist

## Comments

- **Created (orchestrator, 2026-09-28):** at the user's request. jevgrep is installed in WSL (`~/.agents/skills/jevgrep`, symlinked into WSL's `~/.claude`), so a WSL-hosted Claude gets it natively.
