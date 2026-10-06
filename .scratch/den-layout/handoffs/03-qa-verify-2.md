# den-layout/03 qa verify handoff 2 (fix round)

## State

```json
{
  "ticket": "den-layout/03-real-agents-drive-the-pandas",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify of fix round complete. npm test: 2079 pass, 0 fail. smoke:ui: 10 pass. Specify tests (live-actors.test.mjs, live-agents.test.mjs, bridge-live-actors.test.mjs) unchanged from specify commit 296697f. New test file one-panda-per-agent.test.mjs validates fix: role pandas are only live representation.",
  "artifacts": [
    "apps/ui/src/review/live-actors.test.mjs",
    "apps/ui/src/review/live-agents.test.mjs",
    "apps/bridge/bridge-live-actors.test.mjs",
    "apps/ui/src/review/one-panda-per-agent.test.mjs"
  ],
  "decisions": [
    "Light verify scope confirmed: fix round tests validate requirement that role pandas are only live representation. All specify tests pass unchanged. All new tests (one-panda-per-agent: 5 tests) pass and cover fix requirement: one agent = one panda (no duplicate), features from ticket pandas (click select, glow, chip anchor) moved to role pandas, controller ticketPandas option gates ticket-panda path (RestaurantDen passes false)."
  ],
  "failures": [],
  "pending": []
}
```

## Criterion to test map

| Criterion | Test |
| --- | --- |
| Adapter is pure, unit tests for bound, split-off, unbound, scenery | live-actors.test.mjs: bound agent maps, split-off, unbound, scenery; each 9 cell types |
| Bubble shows latest tool, task shows ticket | live-actors.test.mjs bubble tests; live-agents.test.mjs bound panda station |
| Session end returns panda to idle wandering | live-agents.test.mjs when agent's session ends |
| Bridge running + live cell shows panda at station | bridge-live-actors.test.mjs + live-agents.test.mjs main app wires |
| npm test and smoke:ui pass | 2079 pass, 0 fail; smoke:ui 10 pass |
| (Fix) Role pandas only live representation | one-panda-per-agent.test.mjs: one agent=one panda, select, click, RestaurantDen false |

## Comments

QA pass. Fix round verified. 2079 pass, 0 fail, smoke:ui 10 pass. Specify test files unchanged (git diff 296697f HEAD shows no changes). New one-panda-per-agent.test.mjs validates role pandas are only live representation: one live agent yields exactly one panda (no ticket panda), second agent is split-off, click finds ticket ref, selecting lights panda only, RestaurantDen passes ticketPandas false. Developer correctly implemented: agents.applyLive sets userData.ticketRef on role pandas; agents.liveFigures() and setSelected() added; controller.mjs ticketPandas option (default true) gates ticket-panda sync; RestaurantDen passes ticketPandas false.
