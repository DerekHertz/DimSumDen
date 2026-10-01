```json
{
  "ticket": "organism-infra/79-route-advisory-live",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing acceptance tests committed on tests/79-route-advisory-live (dd3038b); ready for developer.",
  "artifacts": [
    "scripts/jev-advisory.test.mjs",
    "scripts/jev-advisory-report.test.mjs"
  ],
  "decisions": [
    "Advisory outcome row shape: kind 'jev-advisory-outcome', fields orchestratorPick/jevPick/userChoice/bounced.",
    "Scope [S2] wired as a new CLI point 'priority-verdict' in jev.mjs (--ticket, --verdict right|wrong).",
    "Scope [S1] orderRow integration tested via buildReport accepting jev-order rows alongside advisory outcome rows."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Implement advisory mode in decide() (show pick/conf, keep effective=orchestrator) and CLI --mode advisory for route.",
      "owner": "developer"
    },
    {
      "item": "Add report.advisory to buildReport() and advisory route section to formatReport() in jev-report.mjs.",
      "owner": "developer"
    },
    {
      "item": "Add 'priority-verdict' CLI point to jev.mjs logging jev-priority-verdict rows.",
      "owner": "developer"
    },
    {
      "item": "Write genome edit (orchestrator.md dispatch step) and ADR 0015 amendment for user to apply.",
      "owner": "developer"
    }
  ]
}
```

## State

Done — all testable criteria have failing tests committed.

## What changed

Branch: `tests/79-route-advisory-live`
Commit: `dd3038b` — "test(79): failing acceptance tests for route advisory-live"

Two new test files:
- `scripts/jev-advisory.test.mjs` — criteria 1 and 3 (advisory mode in decide + CLI)
- `scripts/jev-advisory-report.test.mjs` — criterion 2 + scope additions

16 tests fail for missing features; 1219 existing tests still pass.

## Criterion-to-test map

| Criterion | Tests | Status |
|---|---|---|
| [1] `route --mode advisory` returns pick+conf, logs advisory row; shadow unchanged | `jev-advisory.test.mjs` tests 1,2,4,5,6,8,9,10,11 | 6 failing (pick/conf hidden, CLI rejects mode); 5 pass (row.mode, fallbacks already work) |
| [2] Outcome row + jev-report prints advisory agreement per label | `jev-advisory-report.test.mjs` tests 1–9 | 9 failing (advisory section missing) |
| [3] Outage/missing-key/cap exits 0, dispatch proceeds | `jev-advisory.test.mjs` tests 13,14,15 | failing (CLI rejects --mode advisory) |
| [4] Genome edit + ADR 0015 amendment | — | **human-verified** |
| [S1] orderRow wiring | `jev-advisory-report.test.mjs` test 8 (passes), test 9 | 1 failing |
| [S2] priority-verdict rows | `jev-advisory-report.test.mjs` tests 10,11 | 2 failing (CLI point missing) |

## Decisions made

- Advisory outcome row kind: `"jev-advisory-outcome"` with `orchestratorPick`, `jevPick`, `userChoice`, `bounced` fields.
- `jev-report.mjs` advisory section: `report.advisory = { rows, byLabel, agreed, total, agreementPct }`.
- `formatReport` advisory header must match `/advisory route.*ADR 0015/i`.
- Scope [S2] wired as a new CLI point `priority-verdict` in `jev.mjs` (adds to `CLI_POINTS`).

## Next step

Developer implements against the failing tests on a branch off `main`. All pinned contracts are in the test file headers.

## Suggested skills

`tdd`, `implement`

## Gotchas

- The `closedSet && !live` guard in `jev.mjs` `build()` deletes `result.pick` and `result.conf`; advisory must exempt route from that deletion.
- The CLI's `usage()` string and the `--mode` validation both need to accept `"advisory"`.
- `report.advisory` must always be present (even with zero rows) or tests 5 and 7 will fail on property access.
