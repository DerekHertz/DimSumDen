# 41 qa specify handoff (revised: ADR 0010 weights)

Branch: worktree-agent-ace71c95c10045e95 (main merged in for the ADR change). Test file: scripts/jev-report.test.mjs (5 tests, all red: scripts/jev-report.mjs missing).

## Criterion to test map
- Report prints exit-criteria table from fixture rows: "per-point exit-criteria numbers", "CLI prints the exit-criteria table", "CLI --json".
- Counterfactual token projection per ticket: "counterfactual projection per ticket, joined across short and full refs".
- Added (orchestrator): jev rows with no cell/resolved rows excluded: "jev rows for a ticket with no cell or resolved rows are excluded".

## Pinned contract
- Exports buildReport(rows), formatReport(report); CLI `node scripts/jev-report.mjs --usage <file> [--json]`, default `<ORGANISM_ROOT or cwd>/.scratch/usage.jsonl`.
- Ticket key `<feature>/<NN>`; cell rows may use short NN, jev rows the full slug. Latest jev row per ticket+point.
- Weights per ADR 0010 (user-fixed): haiku 0.5, sonnet 1, opus 2. Weights are pinned as numbers in the tests, not imported.
- Fixture expectations: tier projected 7900 vs baseline 5900 (-33.9%); verify projected 5700 (3.4%); f/01 verify projection 2000; f/02 tier projection 4700.
- Percent text uses one decimal.

State:
```json
{"ticket":"organism-infra/41-jev-report-script","cell":"qa","mode":"specify","current_step":"tests updated to ADR weights, committed, red","artifacts":["scripts/jev-report.test.mjs"],"decisions":["weights haiku 0.5 sonnet 1 opus 2 per ADR 0010","ticket key feature/NN join","latest jev row per ticket+point"],"failures":[],"pending":[{"item":"implement scripts/jev-report.mjs","owner":"developer"}]}
```
