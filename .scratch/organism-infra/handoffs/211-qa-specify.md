# 211 qa specify handoff

Branch `feat/211-spend`, tests commit `af32338920b6b24f36d0fb1e28798a2209274476` (on base 544af0d). All new tests fail for the right reason (missing `scripts/spend-log.mjs`, `scripts/spend.mjs`, `--transcript` flag, `scripts.spend`). One test ("without --transcript ...") passes today by design: it pins that existing callers are unchanged.

```json
{
  "ticket": "organism-infra/211-track-orchestrator-and-cell-spend",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Specify done: 3 test files + 1 fixture helper committed, red for missing features.",
  "artifacts": [
    "scripts/spend-log.test.mjs",
    "scripts/log-cell-spend.test.mjs",
    "scripts/spend-report.test.mjs",
    "scripts/spend-fixture.mjs"
  ],
  "decisions": [
    "New scripts: scripts/spend-log.mjs (--transcript, --role, [--ticket], [--session]) and scripts/spend.mjs (report, --json); package.json scripts.spend = node scripts/spend.mjs.",
    "Row field names are the transcript's: input_tokens, cache_creation_input_tokens, cache_read_input_tokens, output_tokens. Spend row: kind spend, ts, session, role, optional ticket, the four.",
    "A message id repeated across records counts once; the LAST record with that id wins (streamed output_tokens grow).",
    "Delta = transcript total minus the sum of earlier spend rows for the same session; zero delta writes no row, exits 0, stdout still prints the zero totals as JSON.",
    "log-cell --transcript adds the four totals to the cell row (tokens untouched) AND appends a spend row (role = --cell). The report sums spend rows only, never cell rows.",
    "Report JSON: {by_ticket, by_role}, each entry the four plus total; ticketless rows key '(none)'. Text mode prints plain integers, no separators."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Implement scripts/spend-log.mjs, scripts/spend.mjs, log-cell --transcript, npm script; make the listed tests pass without editing them",
      "owner": "developer"
    },
    {
      "item": "Orchestrator/genome line telling the orchestrator when to run spend-log (touches .claude/): deliver as a gated patch, not a test",
      "owner": "developer"
    }
  ]
}
```

## Criterion to test map

AC1 "fixture transcript gives correct four totals, second run logs only the delta":
- `scripts/spend-log.test.mjs`: "a fixture transcript yields the four billed totals...", "a second run on an unchanged transcript logs nothing new", "a second run after the transcript grew logs only the delta", "deltas are tracked per session", "one API message split over several records counts once...", "lines with no usage, and unparseable lines, are skipped", plus rejection tests (bad role, missing role, unknown ticket, missing transcript).

AC2 "spend row for the orchestrator session and for each cell return, no hand-written numbers":
- Orchestrator: `spend-log.test.mjs` (role orchestrator, session defaults to the transcript file name; "--ticket and --session are recorded").
- Cell return: `scripts/log-cell-spend.test.mjs` (four totals on the cell row, spend row, role follows --cell incl. scout, no double count on repeat, no change without --transcript, bad transcript rejected).
- human-verified: that the orchestrator genome/docs actually tell the orchestrator to run it at each usage check and at handoff (the ticket's comment says this is a `.claude/` change delivered as a gated patch).

AC3 "a command prints spend per ticket and per role, orchestrator included":
- `scripts/spend-report.test.mjs`: npm script entry, `--json` sums per ticket and role (orchestrator present, cell rows not double counted), text mode, empty and missing usage.jsonl.

## Notes for the developer

- Real transcripts split one API message over several records with identical usage (seen in this session's own transcript); the fixture reproduces that.
- Reuse `resolveRoot` / `resolveShortRef` from `apps/organism-infra/board-service.mjs` and log-cell's O_NOFOLLOW append for the usage.jsonl write.
- Only the top-level session transcript feeds orchestrator spend; subagent files (`<session>/subagents/agent-*.jsonl`) are passed to `log-cell --transcript`.
- Not covered (open for the developer or user): whether the cell row `tokens` should eventually be dropped; no auto-discovery of the transcript path is specified.
