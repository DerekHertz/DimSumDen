# 112: SubagentStop hook: auto log-cell and warn on a cell that ended without a report

**Type:** feature

**Priority:** P2

**Blocked by:** 109, 110, 111

**Status:** parked

## What to build

The orchestrator runs `log-cell` by hand after every cell's notification. On 2026-10-02 a scout hit its 25-turn limit and ended with no report (36k tokens, then a rerun; SendMessage was unavailable). Add `scripts/subagent-stop.mjs` for a `SubagentStop` hook: read tokens and duration from the hook input or the subagent transcript (check the docs first and cite), append the `kind:"cell"` row through `log-cell`'s code (not a second writer), and print one line: `logged qa:specify 78k / 2.3m`, or `⚠ scout ended without a report (turn limit)`. Ticket, cell and mode come from the board lock or the dispatch prompt's `cell-start` line; with none it logs `ticket: null` and says so. Then drop the manual `log-cell` step from the orchestrator genome (gated patch).

Files: `scripts/subagent-stop.mjs` (+ test), `scripts/log-cell.mjs` (export its writer); gated: `.claude/settings.json`, `.claude/agents/orchestrator.md`.

## Acceptance criteria

- [ ] One `kind:"cell"` row per finished subagent with real tokens and ms; never zeros
- [ ] A subagent with no final report triggers the warning line
- [ ] Rows are written by the same code path as `log-cell`
- [ ] Settings and genome patches in `.scratch/_handoffs/gated/`
- [ ] `npm test` green

## Comments
- **orchestrator, 2026-10-02:** Audit proposal 4, user yes. After batch M (all touch `.claude/settings.json`).
- **orchestrator, 2026-10-03:** Parked: desktop subagents retire after organism-infra/106; the bridge logs cells (refocus, docs/refocus/triage-2026-10-02.md)
