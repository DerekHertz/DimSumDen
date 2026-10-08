# 203: board new and board set-blocked-by, so cells never write board files directly

**Type:** task

**Priority:** P2

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** Relay hygiene (pipeline-retro 2026-10-08). The worktree isolation guard has refused cells' writes to the main checkout's board 8 times. Most recently, architect 143 could not file ticket 202 or edit 143's Blocked by, so both rode a docs PR instead of a board commit.

## What to build

Two board CLI commands that write to the main checkout's board from any worktree, the same way `board comment` and `board handoff` already do:

- `board new <feature> --title "<title>" --type <type> --priority P0|P1|P2|P3 [--blocked-by <refs>] [--serves "<text>"] --body-file <path>` creates `.scratch/<feature>/issues/<next NN>-<slug>.md` with the standard header (Type, Priority, Blocked by, Status `ready-for-agent`, Serves) followed by the body file's `## What to build` / `## Acceptance criteria` sections and an empty `## Comments`. It prints the new ref and appends one event.
- `board set-blocked-by <ref> <refs...|none> --reason "<text>"` rewrites the `**Blocked by:**` line, appends an orchestrator-style comment with the reason (attributed to `--as` or the caller's cell), and appends one event. Every ref is checked to exist first; a missing ref refuses the whole command.

The cell genomes and `docs/agents/issue-tracker.md` name these commands where they say how to file a ticket or change blockers. Those are gated `.claude/` edits, so the developer writes them as a patch.

Files: `apps/organism-infra/board.mjs`, `board-service.mjs`, their tests; `docs/agents/issue-tracker.md`.

## Acceptance criteria

- [ ] `board new` run from a worktree creates the ticket in the main checkout with the next free number and the standard header (test).
- [ ] `board new` refuses a missing `--title`, `--priority` or body file, or an unknown feature, and writes nothing (test).
- [ ] `board set-blocked-by` rewrites only the Blocked by line, appends a comment carrying the reason, and refuses a ref that does not exist (test).
- [ ] `board set-blocked-by <ref> none` writes `None (can start immediately)` (test).
- [ ] `docs/agents/issue-tracker.md` documents both commands; the genome wording ships as a gated patch.
- [ ] `npm test` green.

## Comments
- **orchestrator, 2026-10-08:** Filed from the pipeline-retro on the user's yes (isolation-guard, 8 incidents).
