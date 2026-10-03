# 84: board handoff removes the worktree source copy after publishing

**Type:** fix

**Priority:** P3

**What to build:** Reviewer cells write their handoff into their worktree's `.scratch/`, publish it with `board handoff`, and leave the byte-identical copy behind (twice on 77, despite the prompt). When the source file is inside a git worktree other than the main checkout and publishing succeeds, `board handoff` deletes the source file and says so on stdout. A source file in the main checkout, or outside any worktree, is left in place.

**Blocked by:** none

**Status:** parked

- [ ] Publishing from a worktree's `.scratch/` removes the source file after a successful publish (test)
- [ ] A failed publish (e.g. State block invalid) leaves the source file in place (test)
- [ ] A source outside a linked worktree (main checkout, `/tmp`) is left in place (test)

## Comments

- **Created (orchestrator, 2026-09-30):** pipeline-retro session 15, cause "reviewer leaves handoff copy", tool board-handoff, count 2.
- **orchestrator, 2026-10-03:** Parked: pipeline work not blocking v1 and not a third repeat incident (refocus, docs/refocus/triage-2026-10-02.md)
