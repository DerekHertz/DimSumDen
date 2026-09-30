# 78: `board handoff` refuses a draft saved inside a worktree

**Type:** task

**Priority:** P3

**What to build:** On 2026-09-30, qa verify and security on ticket 77 wrote their handoff drafts into `<worktree>/.scratch/` before publishing. Both left byte-identical copies behind, which blocked `git worktree remove`; the security cell did this even though its prompt said not to. `board handoff --from <file>` should refuse (non-zero exit, with the reason) when `<file>` resolves to a path inside any git worktree other than the main checkout's `.scratch/`, and tell the cell to draft under `/tmp`. See the two `incident` rows with tool `board handoff` in `.scratch/usage.jsonl`.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] `board handoff --from <worktree>/.scratch/x.md` exits non-zero, publishes nothing, and names `/tmp` as the place to draft (test)
- [ ] A draft under `/tmp` or another path outside any worktree still publishes (test)

## Comments

- **Created (orchestrator, 2026-09-30):** From two incidents on ticket 77, published with the user's yes.
