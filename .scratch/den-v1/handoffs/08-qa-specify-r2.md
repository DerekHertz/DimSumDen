# 08 qa specify r2 handoff

```json
{
  "ticket": "den-v1/08-remove-market-scene",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Fix round 1 specify done: apps/ui/reachability.test.mjs amended and committed as 1884c12 on feat/08-remove-market-scene (not pushed). It is red until the developer restores apps/ui/src/overlay/floating-cards.test.mjs.",
  "artifacts": ["feat/08-remove-market-scene @ 1884c12", "apps/ui/reachability.test.mjs"],
  "decisions": [
    "Keep rule widened: new mountsLiveApp(file) keeps a *.test.mjs that mentions apps/ui/vite.config.mjs, calls createServer(, and calls .goto(. It is OR-ed into the keptTests filter, so a browser test of the mounted App is no longer flagged as naming no reachable module.",
    "A wider keep rule alone cannot go red (it only keeps more, and the file is absent), so I added a test 'browser tests that mount the live App survive the removal': a literal list of floating-cards.test.mjs and tally-expand.test.mjs must exist under apps/ui and be recognised by mountsLiveApp. Literal list, not git history, so shallow CI clones work.",
    "Verified three states: old walker + restored floating-cards.test.mjs = red (reproduced the bounce); new walker + restored file = 7/7 green; new walker + file absent (current branch state) = red, 'restore these live-App browser tests', lists src/overlay/floating-cards.test.mjs. I removed my temporary restore, so the branch does not contain the file.",
    "Test count: reachability.test.mjs goes 6 to 7. Expected npm test total after the developer restores the file: 1763 + 33 + 1 = 1797."
  ],
  "failures": [],
  "pending": [
    {"item": "Restore apps/ui/src/overlay/floating-cards.test.mjs unchanged: git show 3df1033:apps/ui/src/overlay/floating-cards.test.mjs (it passes 33/33 with the market modules gone per qa verify). Do not touch reachability.test.mjs. Then npm test, ui:build, smoke:ui, release at in-review.", "owner": "developer"},
    {"item": "Orchestrator: decide on packages/character-director, stale prose mentions, 125 per developer handoff (carried from verify handoff).", "owner": "orchestrator"}
  ]
}
```

## Criterion to test map (changes this round)

| Criterion | Test | State |
|---|---|---|
| No file unreachable from main.jsx except tests of reachable modules (live-App browser tests count) | reachability.test.mjs "no file under apps/ui/src or apps/ui/public is unreachable ..." (keep rule now includes mountsLiveApp) | green with or without the file |
| Live-App browser tests are not deleted with the market scene | reachability.test.mjs "browser tests that mount the live App survive the removal ..." | red until floating-cards.test.mjs is restored (right reason: missing file) |
| Other criteria | unchanged from specify r1 | green |
