```json
{"ticket": "organism-infra/145-cell-context-hook", "cell": "architect",
 "current_step": "Threshold proposal written; waits for the user to approve the numbers before the 145+165 infra relay starts.",
 "artifacts": [],
 "decisions": ["Proposal: tier cell budgets (work cells developer and qa 100k warn / 120k stop; all other cells 70k/80k); orchestrator stays 70k/80k under its own key", "One config file scripts/context-budget.json behind one loader scripts/context-budget.mjs", "Part (3) orchestrator hook: no", "No ADR: thresholds are one reversible config value"],
 "failures": [],
 "pending": [{"item": "User approves or edits the numbers below", "owner": "orchestrator"},
             {"item": "Infra relay batched with 165: config + loader, hook/cell-start/context.mjs read it, gated organism-protocol patch", "owner": "developer"}]}
```

## State
Done (part 1 and the part 3 recommendation). No code changed, no branch, no ADR.

## Evidence (usage.jsonl, 388 cell rows, 295 with a context reading)
Caveat first: a row's `tokens` is about its final context (tokens/context median 1.02 to 1.06), not cumulative billed input. The log cannot give per-call cost, wall time per call, or the cold-start re-read. The cost comparison below is therefore a model, not a measurement. Only 10 rows are partial returns and 6 form chains with a successor, and no cell has run under the 162 hook yet.

Where the 80k cap binds (final context, rows with a reading):
- developer n=21: p50 79k, p75 88k, p90 106k, max 150k. 48% over 80k, 14% over 100k.
- qa specify n=18: p50 73k, p75 111k, p90 125k, max 134k. 39% over 80k, 33% over 100k, 17% over 120k.
- qa verify n=16: p90 71k, max 94k, 6% over 80k. security n=15: p90 59k, max 89k, 1 row over 80k.
- architect n=3 (41k, 115k, plus the unlogged 134k on 140). designer n=3. Too few to tier.

Chains and singles on the named tickets (cells / sum of tokens / wall sum / partials):
- 138: 9 cells, 607k, 31.6 min, 3 partial. Dev chain of 4: 87k (no code written, plan only), 95k, 87k, then 56k to finish. The first successor had to re-read. One later qa fix (S6b test unpassable) was a spec defect, not chain-caused.
- 139: 6 cells, 484k, 34.2 min, 1 partial. qa specify overran to 133k and left "failure reasons unverified"; the successor finished in 50k. A cheap, well-sliced partial. The 118k single developer skipped /code-review "for budget" (a quality cost of the cap) and qa verify then found no defects.
- den-layout/02: 5 cells, 408k, 36 min, 1 partial. Dev 108k then 91k, but the successor took 21.6 min wall.
- den-layout/04: 4 cells, 221k, 13.6 min, 0 partial. Developer 62k single, no rework.
- 140: no cell rows (only a scout audit). The three overruns (qa ~150k, architect ~134k, developer ~141k) were never logged.
- Successors end at 83k to 89k again (median 91k tokens, 0.74x the predecessor): the cap just stops them there too. A partial buys about 55k of new work per cell.

Cost model (sum of per-call context, assuming 30k cold start, uniform growth, 15k re-read per extra cell; my own start reading was 27k; the re-read figure is unmeasured). Cost scales as (C^2 - B^2), so the unknown per-call growth cancels in ratios:
- Task needing 120k of growth: one cell to 150k costs 21.6 units. Cap 80k gives 3 cells = 16.5 (24% less). Cap 100k gives 2 cells = 17.2. Cap 120k gives 2 cells = 18.2 (16% less).
- Task needing 60k of growth: one cell to 90k = 7.2. Cap 80k gives 2 cells = 7.6 (6% worse).
So splitting saves at most about 25% of context-cost on long tasks and loses on short ones; cached reads are cheap, so even that is small. Against it: each partial adds a cold start, 2 orchestrator round trips (the orchestrator's own context is the scarcest), wall time, and handoff-quality risk (138's first dev). The token saving does not justify a cap that fires on half of all developer cells.

## Proposal (user decides)
| Role | warn | stop | Why |
|---|---|---|---|
| developer | 100k | 120k | Binds on 48% at 80k; 14% would still reach 100k; max seen 150k |
| qa (specify and verify) | 100k | 120k | The hook sees agent_type only, not mode. specify p75 111k; verify never exceeds 94k so it just never trips |
| security, architect, designer, scout | 70k | 80k | Rarely bind (security 1 of 15); architect/designer n too small, keep the guardrail |
| orchestrator | 70k | 80k | Long-lived session, many calls; no cell rows measure it |
A single 120k stop leaves a 20k wrap-up margin before 150k, the largest seen. Revisit with 30+ post-162 rows; the per-call cost model should be replaced by a real calls count (log it in log-cell).

## Where the value lives (one seam)
- `scripts/context-budget.json`: `{"default":{"warn":70000,"stop":80000},"cells":{"developer":{...},"qa":{...}},"orchestrator":{...}}`.
- `scripts/context-budget.mjs` (deep module, one export): `budgetFor(role)` returns `{warn,stop}`; unknown role falls back to `default`; a missing or invalid file (non-numbers, warn >= stop) falls back to `default`, so the hook still fails open. An env override (for example `CONTEXT_BUDGET_CONFIG`) is the test seam.
- `scripts/hooks/context-budget.mjs` replaces its `WARN_AT/STOP_AT` constants and the "80k" in both message strings with `budgetFor(input.agent_type)`.
- `scripts/cell-start.mjs` uses `budgetFor("orchestrator")` for `WARN_AT/REFUSE_AT` (its messages already format from the constants).
- `scripts/context.mjs` has no thresholds today; add optional `--cell <type>` that adds `warn`, `stop` and `state` (ok|warn|stop) to the JSON, so `organism-protocol` can say "follow `state`" instead of repeating numbers.
- Tests at the one seam: `budgetFor` (fallbacks, validation), plus the existing hook and cell-start suites run against a fixture config.

## Part 3 recommendation: no
`cell-start` already reads the orchestrator's context at every dispatch, which is where the orchestrator decides to start work, and refuses at the stop value (`--continue` only warns). A PreToolUse hook would spawn node on every orchestrator tool call for a message the statusline and cell-start already deliver; the `/compact` trigger belongs to parked 99. Reopen only if 99 lands and wants a mid-turn signal.

## Next step
Orchestrator: put the table to the user. After approval, dispatch the developer on the 145+165 batch; the developer writes the gated `organism-protocol` "Context budget" edit as `.scratch/_handoffs/gated/145-context-budget.patch` (point it at the config, state the chosen numbers).

## Suggested skills
codebase-design, tdd, organism-protocol.

## Gotchas
- `tokens` is not billing; do not read cost off it.
- `agent_type` carries no qa mode, hence one qa tier.
- 140's three overruns are missing from usage.jsonl.
