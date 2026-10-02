# Handoff: organism-infra/91 developer (batch K)

## State

```json
{
  "ticket": "organism-infra/91-wind-down-at-90",
  "cell": "developer",
  "current_step": "Done. USAGE_WIND_DOWN is 0.9 and the header comment says 90%+, in scripts/jev-wake-prelude.mjs (commit ba57b9a on feat/jg-limit-batchK). All 45 tests in jev-wake-prelude.test.mjs, jev-wake-prelude-cli.test.mjs and wind-down-90.test.mjs pass, including the 8 that were red. Full npm test: 1711 pass, 4 fail; the 4 are the [97] fix tests, not 91.",
  "artifacts": [
    "scripts/jev-wake-prelude.mjs"
  ],
  "decisions": [
    "Two edits only (the constant on line 17, the comment on line 21). No test was touched. The suppression reason string 'usage at N%' needs no change.",
    "AC3 is covered by scripts/wind-down-90.test.mjs, which passes; I also grepped scripts/ for other 0.8 / 80% 5-hour references and found none (qa's scan agrees).",
    "Out of scope, already noted by qa: apps/ui/src/panel/usage-meter-model.mjs line 8 still has `v >= 80 ? \"wind-down\"` for the 5-hour meter. A follow-up ticket for the UI meter is the orchestrator's call. The .claude/ and CLAUDE.md prose edits stay with the user-run apply-90-limit.mjs."
  ],
  "failures": [],
  "pending": [
    {
      "item": "qa verify. Note the batch's 97 half is not built (see 97-developer.md), so the branch has 4 red [97] fix tests; verify 91 against its own three test files.",
      "owner": "qa"
    }
  ]
}
```
