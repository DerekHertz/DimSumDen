# 06: Move the repo from the HDD to the Samsung NVMe

**Type:** task (the user does the move; a cell prepares and checks it)

**What to build:** Move the main checkout from `D:\claude_sessions\agent_office` (a WD 2 TB spinning HDD) to the Samsung 990 PRO NVMe on `C:` (about 670 GB free). Every worktree, `npm install`, test run, `git` command and Blender export in the organism runs off this disk. On the HDD, making one worktree means writing about 190 files.

Steps:
1. Wait for a quiet board: no `.lock` files, no cell running, and every branch worth keeping pushed.
2. List the worktrees (`git worktree list`). Remove merged or abandoned ones first (ask the user; see `05`).
3. The user moves the folder, or re-clones and re-adds the kept worktrees. Then run `git worktree repair` from the new location.
4. Update paths that hard-code `D:/claude_sessions/agent_office`: board Comments and handoffs are history and can stay; anything in `.claude/` or `docs/` that cells follow must change. Set `ORGANISM_ROOT` if it's used. Check Claude Code's project memory folder, which is keyed by path.
5. Re-run `npm test` from the new path.

**Blocked by:** `ci-cd/02` merged (so no cell is running during the move)

**Status:** resolved

- [ ] The repo and the kept worktrees live on `C:`; `git worktree list` shows no stale paths
- [ ] `npm test` passes from the new location
- [ ] Nothing that cells follow still points at `D:/claude_sessions/agent_office`

## Comments

- **Created (orchestrator, 2026-09-27):** At the user's request, from a hardware review. Machine: Ryzen 7 5800X (8 cores/16 threads), 16 GB RAM, RTX 3060 Ti (8 GB); `C:` Samsung 990 PRO NVMe, `E:` Plextor 256 GB SATA SSD (empty, older), `D:` WD 2 TB HDD.
- **unknown, 2026-09-28:** Copied (orchestrator, 2026-09-28, with the user's yes): robocopy D: to C:\claude_sessions\agent_office (2200 files, 0.59 GB). Worktree links were fixed in both copies, and git worktree list is clean on each. Project memory was copied to the C-- key. npm test from C: 122/122 pass. No .claude/ or docs/ paths were hard-coded to D:. D: is kept as a backup. Remaining: the user opens a new session in C:, and later deletes D:. Incident: git worktree repair on the copy cross-linked D and C (both copies' worktrees got pointed at the other's .git); fixed by rewriting the links by hand.
