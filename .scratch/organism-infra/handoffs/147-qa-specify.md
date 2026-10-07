```json
{
  "ticket": "organism-infra/147-dispatch-prompt-script",
  "cell": "qa",
  "mode": "specify",
  "current_step": "tests committed on tests/147-dispatch-prompt-script @ 7ca8bc2, red (55 of 55 fail: scripts/dispatch-prompt.mjs does not exist)",
  "artifacts": ["scripts/dispatch-prompt.test.mjs @ 7ca8bc29bc91bb0452c9a276d44003f41f85ab9e on tests/147-dispatch-prompt-script"],
  "decisions": [
    "CLI-only seam: subprocess with ORGANISM_ROOT = tmp board root, PATH=/usr/bin:/bin (no jg); the Start-here path comes from a pre-created .scratch/_context/<feature>/<slug>.md that dispatch-context reuses, and no-path comes from a non-code (research) ticket",
    "output contract: one line containing `node scripts/cell-start.mjs ...` (whitespace tokens), a note matching /worktree/i, the ticket path .scratch/<f>/issues/<slug>.md, the handoff name, one release flag form",
    "branch cells (qa specify, developer) get --base <sha> --branch <b>; reviewers (qa verify, security, designer critique) get --base <sha> --detach and no --branch; architect and designer spec/direction: exactly one of --branch/--detach",
    "release forms: qa specify, qa verify, security, designer critique = --keep-status; developer, architect = --status in-review; designer spec and direction = --status ready-for-agent; never --status resolved",
    "handoff name <NN>-<cell>[-<mode>].md; when it already exists in the main checkout's handoffs dir the name becomes -2, then -3 (max existing + 1); other cells' or modes' handoffs do not bump it",
    "bad arguments exit 2 with empty stdout and a reason on stderr: missing --ticket/--cell, unknown cell, qa without --mode, unknown qa/designer mode, unknown flag, valueless flag, malformed ref, and a ticket with no .scratch/<f>/issues/<slug>.md (including a file at .scratch/<f>/<slug>.md)",
    "writes nothing: snapshot of board root and cwd identical after a run, no usage.jsonl (checked on the context-present path; the no-path path runs dispatch-context, which logs its own jg usage row, so that is not asserted)"
  ],
  "failures": [],
  "pending": [
    {"item": "implement scripts/dispatch-prompt.mjs so scripts/dispatch-prompt.test.mjs passes; do not edit the tests", "owner": "developer"},
    {"item": "write the exact orchestrator-genome diff (.claude/agents/orchestrator.md, gated) into the developer handoff, per ticket criterion 4", "owner": "developer"}
  ]
}
```

# 147 qa specify handoff

Branch `tests/147-dispatch-prompt-script`, tests commit `7ca8bc29bc91bb0452c9a276d44003f41f85ab9e`, one file: `scripts/dispatch-prompt.test.mjs` (node --test, 55 tests, all red because the script is missing).

## Criterion to test map

| Criterion | Tests |
| --- | --- |
| 1. Right cell-start flags and release flag per cell and mode (table) | `table: <cell> [mode] prints exactly one cell-start line...` and `...prints the release flag...` for qa specify, developer, qa verify, security, designer critique/spec/direction, architect; `designer review prints exactly one valid release form`; `--continue is added on later hops`; `a note says it runs inside the cell's worktree` |
| 2. Unresolvable ticket ref exits 2 | `ticket ref that does not resolve...`, `unknown feature`, `the old bug: ... no issues/`; ticket path test `includes issues/` |
| 3. Start-here only for architect, qa specify, developer | `start-here:` tests: line present with a path and absent without one for the three cells; absent for qa verify, security, designer (all four modes) even when a context file exists |
| 4. Orchestrator-genome diff in the developer handoff | human-verified (no test). Check the developer handoff holds the exact diff for `.claude/agents/orchestrator.md`. |
| Scope added 2026-10-05 (re-dispatch handoff name) | `handoff path:` tests: first name, `-2` when the plain name exists, `-3`, other cells do not bump |
| Also from the body | `batch:` name shown; `it writes nothing`; `bad arguments exit 2` table (9 cases) |

## Assumptions for the orchestrator to confirm (the ticket leaves them open)

- Designer `review` is not pinned to one release form (only "exactly one valid form"), because the ticket's "`--status ready-for-agent` for a design-only review" cannot be told apart from a code-ticket review by the arguments. If a flag distinguishes them, add a test.
- Designer `critique` keeps status (detached reviewer); designer `spec` and `direction` release at `ready-for-agent`.
- Architect and designer spec/direction are free to choose `--branch` or `--detach`; the test requires exactly one.
- Missing `--base`/`--branch` for a cell that needs them is not tested (the ticket marks both optional).

## Environment

`npm ci` ran in cell-start. No failed calls beyond one refused compound shell probe (worktree guard), retried as plain commands.
