# 07: Put disposable caches on the Plextor SSD (E:)

**Type:** task

**What to build:** Point caches the organism can re-create at `E:\agent-office-cache\`, so `C:` stays uncluttered and losing the older Plextor drive costs nothing:
- the npm cache (`npm config set cache`, user-level, not in the repo)
- Playwright browser downloads (`PLAYWRIGHT_BROWSERS_PATH`), if `ci-cd/02` ends up downloading any
- Blender render and scratch output from asset and critique rounds
- local model weights (`OLLAMA_MODELS`), if `04` picks a local model

Nothing irreplaceable goes on `E:`: no repo, no worktrees, no board.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Each cache's location is set and documented in `docs/agents/` (one short section)
- [ ] Deleting `E:\agent-office-cache\` entirely is harmless: everything re-downloads or rebuilds
- [ ] Changing user-level environment variables or npm config is a brain gate: the cell proposes the exact commands and the user runs or approves them

## Comments

- **Created (orchestrator, 2026-09-27):** At the user's request, from a hardware review (see `06`).
