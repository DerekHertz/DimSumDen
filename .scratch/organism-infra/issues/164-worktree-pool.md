# 164: Pool of ready worktrees for relay cells

**Type:** feature

**Priority:** P3

**Blocked by:** none

**Status:** needs-design

**Serves:** Relay setup cost. Every relay cell creates a fresh worktree and runs `npm ci` in `cell-start`; the setup is pure machine time and leaves worktrees behind for `worktree-gc` to clean.

## What to build

`cell-start` takes a worktree from a small pool of ready worktrees (dependencies already installed), resets it to the cell's base SHA or branch, and reinstalls only when the lockfile changed. Finished cells return their worktree to the pool instead of leaving it for `worktree-gc`.

Measure first: have `scout` pull per-cell setup time (worktree creation + `npm ci`) from the cell logs and transcripts, so the gain is known before design. Then `architect` settles how it fits with Agent-tool `isolation: "worktree"` (which creates its own worktree), pool size vs `max_concurrent_cells`, and reset safety (dirty files, stash, leftover processes; see `docs/agents/process-hygiene.md`).

Not in scope: pooling agents themselves. A reused agent carries one ticket's context into the next, which costs tokens on every call and breaks reviewer independence (orchestrator, 2026-10-06).

## Acceptance criteria

- [ ] Setup time per cell measured and recorded in this ticket
- [ ] Design settled (architect handoff or ADR) for pool lifecycle, reset, and the Agent-tool isolation interaction
- [ ] `cell-start` reuses a pooled worktree and skips `npm ci` when the lockfile is unchanged (test)
- [ ] A reset refuses a dirty pooled worktree instead of discarding its changes (test)
- [ ] `npm test` passes

## Comments

- **orchestrator, 2026-10-06:** Filed at the user's request (likes the idea, low priority; north star tickets first).
