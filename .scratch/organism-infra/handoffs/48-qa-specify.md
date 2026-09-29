```json
{"ticket": "organism-infra/48-scripted-usage-rows", "cell": "qa", "mode": "specify", "current_step": "failing tests committed (revised for --verdict); 9 red, rest vacuously green until feature exists",
 "artifacts": ["scripts/usage-rows.test.mjs"],
 "decisions": ["bounce count = comment events for the ticket with verdict bounce, recorded via board comment --verdict pass|bounce; other values refused, nothing written; comments without --verdict count 0 whatever their text", "--pr required (positive integer) when ticket Type is feature or bug; else optional and row pr is null", "log-cell validates ticket file exists, cell type is known, tokens and ms are non-negative integers, outcome non-empty"],
 "failures": [],
 "pending": [{"item": "implement board comment --verdict, board release resolved row, scripts/log-cell.mjs, ADR 0008 update", "owner": "developer"}]}
```

## State

Partial: tests written and red for the right reason (unrecognized flags --pr and --verdict, missing log-cell.mjs, ADR lacks text).

## What changed

Branch worktree-agent-a3e6b5349c3429961, commits 2db9963 then bf29f8f (verdict contract change from the coordinator). File scripts/usage-rows.test.mjs. Contract pinned in its header.

## Decisions made

See the State block and the test file header. Root for usage file is $ORGANISM_ROOT else cwd.

## Next step

developer implements to make the tests pass. Also update ADR 0010 if it names who writes these rows.

## Suggested skills

tdd, implement

## Gotchas

Some rejection tests (bad --pr, bogus --verdict, bad log-cell input) pass before implementation because unknown flags and a missing script already exit non-zero; the developer must not weaken them.
