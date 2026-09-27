# 02: `board` CLI with a direct-file backend

**What to build:** A `board` command that every cell calls through the shell for all board changes: claim, release, status, comment and list, with the command set from 01's ADR. Until the daemon exists, it writes the markdown board in the main checkout directly. It finds the checkout via `$ORGANISM_ROOT` or `git worktree list`, and claims with atomic lock files. Its interface must match 01's ADR, so ticket 03 can swap the transport without changing the calls.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `board claim|release|status|comment|list` work from any worktree and write only to the main checkout's board
- [ ] Two concurrent claims of the same ticket: exactly one wins (tested)
- [ ] Comments are appended with the cell type and date; statuses are validated against `docs/agents/issue-tracker.md`
- [ ] `organism-protocol` and the genomes tell cells to use `board` rather than editing board files (brain gate: genome change)
- [ ] Runs the full code relay: qa specify, developer, qa verify, security review
