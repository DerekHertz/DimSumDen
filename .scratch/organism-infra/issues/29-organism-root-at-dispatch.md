# 29: Set ORGANISM_ROOT for dispatched cells

**Type:** task

**What to build:** `ORGANISM_ROOT` is unset in cell shells under WSL. Board commands fall back to `git worktree list`, but security exported it by hand each call. Set it at dispatch (session env or settings) so every cell sees the main checkout path.

**Blocked by:** None

**Status:** ready-for-agent

- [ ] A freshly dispatched cell sees `ORGANISM_ROOT` pointing at the main checkout
- [ ] Documented in `docs/agents/issue-tracker.md`

## Comments
