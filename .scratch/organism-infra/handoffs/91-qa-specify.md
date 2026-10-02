# Handoff: organism-infra/91 qa specify (batch K)

## State

```json
{
  "ticket": "organism-infra/91-wind-down-at-90",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Batch K tests committed on tests/jg-limit-batchK (c2aec2a, base 0a7198d). 8 of the 91 tests fail for the missing feature (the constant is still 0.8); the others pass now and are guards for 90%. Rest of npm test is green (1703 pass, 12 fail, all 12 are batch K red tests).",
  "artifacts": [
    "scripts/jev-wake-prelude.test.mjs (80% boundaries moved to 90%, new tests tagged [91])",
    "scripts/jev-wake-prelude-cli.test.mjs (CLI boundaries, tagged [91])",
    "scripts/wind-down-90.test.mjs (new: AC3 scan)"
  ],
  "decisions": [
    "I edited the existing 80% tests in place, as the ticket directs: the 0.799/0.8 boundary became 0.899/0.9, and the pinned contract comment at the top of jev-wake-prelude.test.mjs now says 90%. The old 'usage at 80%+ suppresses' tests were replaced, not loosened: the suppressing cases are 0.9, 0.95 and 1.0, and new tests assert 80%, 85% and 89% now WAKE on a frontier (the suppress bound moved up, so those are the red tests).",
    "The CLI suppression case at 90% with a frontier only is not tested: suppression falls through to the gh CI read, which makes the outcome depend on whether gh works in the test environment. The boundary is covered at codeDecides and runPrelude, and the CLI covers 89% and 85% (frontier wakes) and 90% with a cell in flight (still wakes).",
    "AC3 is a no-remaining-reference criterion, so wind-down-90.test.mjs reads the non-test scripts/**/*.mjs sources: jev-wake-prelude.mjs must hold no '0.8' or '80%' and USAGE_WIND_DOWN must equal 0.9; and no non-test script may name 80% (or 0.8) on a line that also says usage, wind-down, 5-hour, five-hour or suppress, unless the line mentions the week. Today no such line exists beyond jev-wake-prelude.mjs (lines 17 and 21). The developer must also update the comment on line 21 (it says 80%+), or the scan fails.",
    "Out of scope but found: apps/ui/src/panel/usage-meter-model.mjs line 8 has `v >= 80 ? \"wind-down\"` for the 5-hour meter (with tests in apps/ui/src/panel/usage-meter-model.test.mjs and tally-face). The ticket limits itself to scripts/, so I did not test it. The orchestrator may want a follow-up ticket for the UI meter and the 90% line."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Change USAGE_WIND_DOWN to 0.9 in scripts/jev-wake-prelude.mjs and update its comments (header comment at line 21 names 80%+). The suppression reason string 'usage at N%' needs no change. Do not edit .claude/ or CLAUDE.md (user-run apply-90-limit.mjs). Never loosen the tests.",
      "owner": "developer"
    }
  ]
}
```

## Criterion-to-test map

1. Frontier wake is suppressed at 90% or more and not at 89.9%:
   - `scripts/jev-wake-prelude.test.mjs`: "[91] AC1: usage at 90%+ suppresses a frontier wake; 89.9% does not" (red)
   - "[91] AC1: the old 80% line no longer suppresses a frontier wake (80%, 85%, 89% all wake)" (red)
   - "[91] AC1: the suppression reason names the 90% reading" (passes now)
   - "[91] AC1: runPrelude at 90%+ usage: a frontier alone does not wake, and says why" (passes now)
   - "[91] AC1: runPrelude at 85% usage: a frontier still wakes (the line is 90%)" (red)
   - "codeDecides: usage alone never wakes, at any level" (extended with 0.899, 0.9)
   - `scripts/jev-wake-prelude-cli.test.mjs`: "[91] AC1: CLI at 89% usage a non-empty frontier still wakes" (red), "[91] AC1: CLI at 85% usage a non-empty frontier still wakes (it was suppressed at the old 80% line)" (red)
2. Wind-down items still wake at 90% or more (new boundary):
   - "[91] AC2: wind-down items still wake at 90%+ usage, including exactly 90% and 89.9%" (passes now; guard)
   - "[91] AC2: runPrelude at 90%+ usage, user-authored, Scope added and verdict comments still wake without Jev" (guard)
   - CLI: "[91] AC2: CLI at 90% usage a cell in flight still wakes, with no Jev row logged" (guard)
3. No remaining 80% 5-hour reference in `scripts/` except the weekly check, in `scripts/wind-down-90.test.mjs`:
   - "[91] AC3: the wake prelude has no 80% / 0.8 left (its wind-down line is 90%)" (red)
   - "[91] AC3: the prelude's wind-down constant reads 0.9" (red)
   - "[91] AC3: no non-test script names 80% beside usage, wind-down or a 5-hour reading, except a weekly check" (red until the line-21 comment is updated)
