# 169: worktree-gc removes finished cells' locked worktrees and prunes merged agent branches

**Type:** bug

**Priority:** P3

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** Worktree cleanup after a merge (orchestrator relay stage 5). Retro 2026-10-06: finished cells leave their harness worktrees locked by the live session pid ("claude agent agent-<id> (pid <n> ...)"), so `git worktree remove` and `worktree-gc` refuse them until the orchestrator unlocks each by hand. This happened twice this session. About 80 merged `worktree-agent-*` branches also piled up, because gc deletes only the branch a removed worktree had checked out (user yes, 2026-10-06).

## What to build

1. In `scripts/worktree-gc.mjs`, a worktree whose lock reason is a Claude agent lock (`claude agent agent-<id> ...`) and which is otherwise removable (clean, or only byte-identical/`.claude/` dirt, and its HEAD is merged into main) is listed as `removable (agent lock)`. `--apply` unlocks it and then removes it. Any other lock reason stays untouched and is reported as today.
2. List local branches named `worktree-agent-*` that no worktree has checked out and that are fully merged into main as `prunable branch`. `--apply` deletes them with `git branch -d` (never `-D`). Unmerged ones are listed, not touched.
3. The dry run prints both new categories, so the user can see them before `--apply`.

Files: `scripts/worktree-gc.mjs` and its tests.

## Acceptance criteria

- [ ] A clean, merged worktree with an agent lock is reported `removable (agent lock)` in the dry run and is unlocked and removed by `--apply` (test with a fixture repo)
- [ ] A worktree with a non-agent lock reason, or with uncommitted work, is not touched (test)
- [ ] Merged `worktree-agent-*` branches with no worktree are deleted by `--apply` with `git branch -d`; unmerged ones are listed and kept (test)
- [ ] The dry run changes nothing (test)
- [ ] Existing worktree-gc tests still pass

## Comments

- **orchestrator, 2026-10-06:** Filed from the pipeline retro (user yes, 2026-10-06).
