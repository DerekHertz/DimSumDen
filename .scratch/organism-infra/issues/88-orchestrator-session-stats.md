# 88: Orchestrator session stats

**Type:** feature

**Priority:** P2

**Blocked by:** None

**Status:** parked

## What to build

Every cell logs a `kind:"cell"` row in `.scratch/usage.jsonl` through `scripts/log-cell.mjs`, but the orchestrator, which runs as the main session, almost never does: all-time counts are qa 84, developer 64, security 38, designer 12, orchestrator 1. Give the orchestrator a session row so its cost and work can be compared with the cells and shown in the UI.

- A script (or a `log-cell` mode) that the orchestrator runs at handoff and that appends one `kind:"orchestrator-session"` row with: `session`, `started`, `ended`, `tokens` (from the session transcript; say how it is read), `context_peak` (max of the session's `context` rows), `dispatches` (per cell type), `merges` (PR numbers), `resolved` (ticket refs), `bounces`, `incidents`, and Jev agreement: how many advisory routes and tiers where Jev's pick matched the dispatched cell or model, out of how many.
- The orchestrator genome's handoff step names the command. Changing `.claude/` is gated; the developer writes the exact edit into its handoff (orchestrator genome, "Code relay").
- Bug fix: `log-cell.mjs` finds the board from `ORGANISM_ROOT` or `process.cwd()`, so run from a worktree it misses handoffs published to the main checkout and refuses the row (it would also append to the worktree's `usage.jsonl`). Resolve the root the way `board` does: the first entry of `git worktree list`.
- Expose the rows through the bridge's metrics endpoint so the UI can show them. The den-scene Tally's expanded view (den-scene-v1/05) is the likely place; a follow-up den-scene ticket shows them.

## Acceptance criteria

- [ ] One command appends a valid `orchestrator-session` row with every field above (test with a fixture transcript and usage log)
- [ ] Jev agreement counts match the session's `jev` rows with `mode: advisory` and the dispatched cell (fixture test)
- [ ] `log-cell.mjs` run from a linked worktree finds handoffs in the main checkout and writes to the main checkout's `usage.jsonl` (test)
- [ ] The bridge's metrics response includes the latest orchestrator session rows (test)
- [ ] The orchestrator genome edit is written into the developer's handoff for the user to apply

## Comments

- **orchestrator, 2026-10-01:** Filed on the user's yes (2026-10-01). Found by the frontend orchestrator: log-cell refused two designer rows from the worktree until rerun from the main checkout (incident logged).
- **orchestrator, 2026-10-01:** Sequencing: organism-infra/90 renames log-cell.mjs to log-panda.mjs; run 88 after 90, or rebase.
- **orchestrator, 2026-10-01:** How to read tokens (tested 2026-10-01): sum message.usage (input, cache_creation, cache_read, output) per message id, keeping the row with the highest output_tokens, from ~/.claude/projects/<cwd-slug>/<session>.jsonl for the main session and <session>/subagents/*.jsonl for cells, grouped by message.model. Weighting by API price gave main Opus about 37%, Sonnet cells 57%, Haiku and Opus cells the rest; cache reads dominate (11.8M main, 30M cells over about 40 minutes). Include a cost-weighted share in the row.
- **orchestrator, 2026-10-06:** Parked: User 2026-10-05: no Serves line naming a den-v1 step (refocus guardrail, ADR 0019 decision 8); park until v1 works.
