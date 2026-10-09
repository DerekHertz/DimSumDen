# 211: Track real billed-token spend for the orchestrator and cells

**Type:** feature

**Priority:** P1

**Blocked by:** None

**Status:** resolved

**Serves:** Testbed friction: orchestrator spend has never been measured (the user has asked more than once), and cell `tokens` looks like final context rather than billed tokens. Split from 210.

## What to build

1. **Real spend.** A script that reads a Claude session transcript (JSONL under `~/.claude/projects/<project>/`) and sums the billed usage per message (input, cache creation, cache read, output), then appends one `{"kind":"spend",...}` row to `.scratch/usage.jsonl` with `session`, `role` (`orchestrator` or the cell type), `ticket` when known, and the four totals. The orchestrator runs it at each relay step's usage check and at handoff, with deltas since its last row so spend is not double-counted. For cells, `log-cell.mjs` takes the subagent transcript, or the orchestrator passes it in, and records the same four totals beside today's `tokens` field (which looks like final context, not billed tokens).
2. **Report.** `pipeline-retro`, or a small `npm run spend` command, prints spend per ticket and per role, the orchestrator included, so the budget change can be judged against the log already gathered.


## Acceptance criteria

- [ ] Given a fixture transcript, the spend script outputs the correct four totals, and a second run logs only the delta.
- [ ] A `spend` row is written for the orchestrator session and for each cell return, without hand-written numbers.
- [ ] A command prints spend per ticket and per role, the orchestrator included.

## Comments
- **orchestrator, 2026-10-09:** Split from 210 on the user's decision. The orchestrator and genome docs need a line telling the orchestrator when to run it; deliver that as a command for the user if it touches `.claude/`.
- **qa, 2026-10-09:** QA pass (light verify): suite green (3123 pass, 0 skipped; 116 targeted at HEAD), qa tests unchanged, AC1-3 mapped. Out of scope: .claude/agents/orchestrator.md (4ff113d). See handoffs/211-qa-verify.md.
- **security, 2026-10-09:** Security pass. No critical/high. Low: non-atomic read-then-append in spend delta (spend-lib.mjs:49, spend-log.mjs:55); --transcript/--session are unvalidated local inputs. gitleaks clean, no new deps. See handoffs/211-security.md.
