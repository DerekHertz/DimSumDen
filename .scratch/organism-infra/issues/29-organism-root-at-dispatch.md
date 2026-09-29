# 29: Set ORGANISM_ROOT for dispatched cells

**Type:** task

**What to build:** `ORGANISM_ROOT` is unset in cell shells under WSL. Board commands fall back to `git worktree list`, but security exported it by hand each call. Set it at dispatch (session env or settings) so every cell sees the main checkout path.

**Blocked by:** None

**Status:** resolved

- [x] The board finds the main checkout from any worktree without `ORGANISM_ROOT` (criterion revised with the user, 2026-09-28)
- [x] Documented in `docs/agents/issue-tracker.md`

## Comments
- **Resolved (orchestrator, 2026-09-28):** resolveRoot already falls back to `git worktree list`; verified from a temp worktree with ORGANISM_ROOT unset. User prefers no hardcoded root. Docs updated; dispatch prompts drop the export. Regression test for resolveRoot-from-worktree folded into 34.
