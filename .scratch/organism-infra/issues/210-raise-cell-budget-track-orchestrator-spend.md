# 210: Raise the cell context budget; track real orchestrator and cell token spend

**Type:** feature

**Priority:** P1

**Blocked by:** None

**Status:** ready-for-agent

**Serves:** Testbed friction: partial returns at the 80k cell cap cost runs with no measured benefit (26 partials, ~2.7M tokens; 143 qa specify used two cells without finishing). Orchestrator spend has never been measured, which the user has asked for more than once.

## What to build

1. **Budget.** In `scripts/context-budget.json`, set `developer`, `qa` and `designer` to warn 100k and stop 130k. Leave the orchestrator and the default at 70k/80k. Update every test and doc that pins the cell numbers (`scripts/hooks/context-budget*.test.mjs`, `scripts/cell-start-context-config.test.mjs`, statusline, `docs/agents/`). The 80k cell figures in `.claude/agents/*.md` and in the `organism-protocol` skill are gated files: write the exact edit into the handoff as one command the user runs (see the orchestrator genome on `.claude/` tickets).
2. **Real spend.** A script that reads a Claude session transcript (JSONL under `~/.claude/projects/<project>/`) and sums the billed usage per message (input, cache creation, cache read, output), then appends one `{"kind":"spend",...}` row to `.scratch/usage.jsonl` with `session`, `role` (`orchestrator` or the cell type), `ticket` when known, and the four totals. The orchestrator runs it at each relay step's usage check and at handoff, with deltas since its last row so spend is not double-counted. For cells, `log-cell.mjs` takes the subagent transcript, or the orchestrator passes it in, and records the same four totals beside today's `tokens` field (which looks like final context, not billed tokens).
3. **Report.** `pipeline-retro`, or a small `npm run spend` command, prints spend per ticket and per role, the orchestrator included, so the budget change can be judged against the log already gathered.

## Acceptance criteria

- [ ] developer, qa and designer warn at 100k and stop at 130k; orchestrator and default are unchanged; tests are updated.
- [ ] Given a fixture transcript, the spend script outputs the correct four totals, and a second run logs only the delta.
- [ ] A `spend` row is written for the orchestrator session and for each cell return, without hand-written numbers.
- [ ] A command prints spend per ticket and per role, the orchestrator included.
- [ ] The gated `.claude/` and skill text edits come in the handoff as one command for the user.

## Comments
- **orchestrator, 2026-10-09:** User 2026-10-09: raise the cell budget (developer, qa, designer) to 100k/130k; the orchestrator stays at 80k. Fold orchestrator spend tracking into this ticket. Data: about 40 cell runs finished past 80k anyway; on 10-08, 9 partials and 409k per resolved ticket. Orchestrator peaks fell from ~300k to ~80k under its gate, so that gate stays. Prior hook tickets: 145, 165, 208.
