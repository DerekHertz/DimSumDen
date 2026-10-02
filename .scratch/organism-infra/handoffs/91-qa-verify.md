# Handoff: organism-infra/91 qa light verify (batch K)

## State

```json
{
  "ticket": "organism-infra/91-wind-down-at-90",
  "cell": "qa",
  "mode": "verify",
  "current_step": "QA pass for 91 at 97275b0 (batch K, feat/jg-limit-batchK). npm test 1729/1729 pass, 0 skipped on the second full run (first run: 2 timing flakes in board lock tests, unrelated, pass on rerun; see 97-qa-verify.md). My specify tests for 91 are unchanged: git diff c2aec2a HEAD on jev-wake-prelude.test.mjs, jev-wake-prelude-cli.test.mjs and wind-down-90.test.mjs is empty. The only source change is scripts/jev-wake-prelude.mjs (USAGE_WIND_DOWN 0.8 to 0.9 and the line-21 comment 80%+ to 90%+).",
  "artifacts": [
    "scripts/jev-wake-prelude.mjs"
  ],
  "decisions": [
    "AC1 (frontier wake suppressed at 90%+, not at 89.9%): '[91] AC1: usage at 90%+ suppresses a frontier wake; 89.9% does not', '[91] AC1: the old 80% line no longer suppresses...', 'runPrelude at 85%...', CLI at 89% and 85% in jev-wake-prelude.test.mjs and jev-wake-prelude-cli.test.mjs. AC2 (wind-down items still wake at 90%+): the three '[91] AC2' tests. AC3 (no 80% 5-hour reference in scripts/): the three '[91] AC3' tests in scripts/wind-down-90.test.mjs. All pass.",
    "Files outside scope: none for 91 (batch diff vs main is scripts/ only). The 97 files in the batch are covered in 97-qa-verify.md.",
    "Carried from specify: apps/ui/src/panel/usage-meter-model.mjs still has a >= 80 wind-down line for the 5-hour meter (outside this ticket's scripts/ scope); the orchestrator may want a follow-up ticket."
  ],
  "failures": [],
  "pending": [
    {
      "item": "npm run risk-check, then PR and merge of batch K (97 needs full security).",
      "owner": "orchestrator"
    }
  ]
}
```

## Verdict

QA pass (91).
