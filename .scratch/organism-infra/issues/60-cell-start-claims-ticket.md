# 60: cell-start claims the ticket

**Type:** task

**Priority:** P2

**What to build:** `node scripts/cell-start.mjs ... --ticket <ref> --cell <type> [--mode <m>]` runs `board claim` itself after setting up the worktree, before the cell does any work, and exits non-zero if the claim fails. Without `--ticket`, behaviour is unchanged.

**Blocked by:** None

**Status:** ready-for-agent

- [ ] `--ticket` claims before exiting 0; a refused claim exits non-zero with the board's message
- [ ] Without `--ticket`, unchanged
- [ ] `docs/agents/cell-start.md` documents the flag, and the orchestrator's dispatch lines pass it

## Comments
- **Retro (orchestrator, 2026-09-29):** qa claimed after writing and pushing tests twice on showcase-v1/07. Wording already says to claim first, so this is a code fix. User approved.

- **Renumbered (orchestrator, 2026-09-29):** was cloud organism-infra/31; the local board used that number for a different ticket.
