```json
{
  "ticket": "organism-infra/217-board-claim-cell-flag",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests written and committed on fix/217-board-claim-cell-flag (8fb6f76). 6 of 7 fail for the right reason (missing feature); the 7th is a regression guard that already passes.",
  "artifacts": [
    {"path": "apps/organism-infra/board-claim-cell-flag.test.mjs", "note": "7 tests, commit 8fb6f76, branch fix/217-board-claim-cell-flag"}
  ],
  "decisions": [
    "Usage line is pinned loosely: stderr must match /usage/i and /board claim <ref>/, and name the bad flag. Developer picks the exact wording.",
    "Unknown flags on claim already throw 'unrecognized flag' today, but without a usage line, so the --as test fails on the missing usage line.",
    "A positional cell plus the same --cell value is allowed (not a conflict); only differing values are refused. The conflict message must name both values."
  ],
  "failures": [],
  "pending": [
    {"item": "Implement --cell on `claim` in apps/organism-infra/board.mjs (add to allowed flags, conflict check against positional cell, usage line on parse errors for claim); then make the tests pass and run npm test", "owner": "developer"}
  ]
}
```

## Criterion to test map

- AC1 (`--cell qa` claims like positional): tests 1 ("--cell developer claims exactly as positional": exit code, stdout, lock holder, status, event) and 2 ("--cell qa --mode specify": lock cell and mode).
- AC2 (`--as qa` non-zero, usage line, no lock): test 3 (`--as qa`), plus test 4 (positional plus `--as`).
- AC3 (positional and `--cell` with different values refused): test 5 (refused, no lock, stderr names both values); test 6 (same value is OK); test 7 (`--cell` with no value is refused, already passes).
- AC4 (`npm test` green): no new test. Developer's job, qa verifies.

Nothing here is human-verified; every criterion is automated.

## Current red state

Tests 1 to 6 fail (test 7 passes now): `--cell` gives "unrecognized flag: --cell"; `--as` gives "unrecognized flag: --as" with no usage line.

## For light verify

Specify sha: 8fb6f76. Run `git diff 8fb6f76 HEAD -- apps/organism-infra/board-claim-cell-flag.test.mjs`.
