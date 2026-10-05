# 131: Design a real write boundary for cells (an OS sandbox or a read-only `.claude/`)

**Type:** design

**Priority:** P3

**What to build:** A decision, as an ADR, on how to stop a cell from rewriting its own permission surface. ADR 0016 decision 6.10 ships only a speed bump: a deny rule on the editor tools for `.claude/**` does not stop a Bash command from writing the same files, so an unattended cell can still add allow rules to the worktree's settings. Security's review (finding M6) deferred the real fix because it changes how every cell runs, not only cells the bridge spawns.

The architect compares: running cells under an OS sandbox, making the worktree's `.claude/` read-only, or a clean worktree check at hand-back (a diff of `.claude/` that fails the release). It names cost, what it breaks (the orchestrator edits `.claude/` with the user's permission, and the repo's tooling writes under it), and which cell types it covers.

**Blocked by:** None

**Status:** parked

- [ ] An ADR records the options, the chosen one and why, and the effect on each cell type
- [ ] Implementation tickets are proposed, not written, and the user decides which to publish
- [ ] The macOS and WSL situations are both addressed

## Comments
- **Created (orchestrator, 2026-10-01):** deferred from ADR 0016 decision 6.10. Low priority until headless cells run unattended in earnest.
- **orchestrator, 2026-10-04:** Filed from the Mac session of 2026-10-01, where it was ticket 92 and never pushed. Renumbered because main reused 82-94. Other Mac numbers in the body map to main as: 83, 84 -> 105; 86, 87, 88, 89 -> 106; 90 -> 107.
- **orchestrator, 2026-10-05:** Parked: Parked at filing (user, 2026-10-04): refocus rules supersede; names no v1 den-loop step or repeated testbed friction (docs/refocus/triage-2026-10-02.md)
