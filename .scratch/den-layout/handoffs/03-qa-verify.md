# den-layout/03 qa verify handoff

## State

```json
{
  "ticket": "den-layout/03-real-agents-drive-the-pandas",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify complete. npm test: 2074 pass, 0 fail, 0 skipped. smoke:ui: 10 pass. All test files match spec commit 296697f (no assertions weakened). Branch at bb23dac.",
  "artifacts": [
    "apps/ui/src/review/live-actors.test.mjs",
    "apps/ui/src/review/live-agents.test.mjs",
    "apps/bridge/bridge-live-actors.test.mjs"
  ],
  "decisions": [
    "Light verify scope confirmed: all my specify tests pass, no test assertions weakened by developer, all acceptance criteria mapped to passing tests."
  ],
  "failures": [],
  "pending": []
}
```

## Criterion to test map

| Criterion | Test |
| --- | --- |
| Adapter pure, unit tests for bound, split-off, unbound, scenery | live-actors.test.mjs: bound agent maps...; second live agent...split-off; roles with no live agent...; 4 scenery pandas...; each of the 9 cell types...; adapter is pure |
| Bubble shows latest tool, task shows ticket | live-actors.test.mjs: bubble shows latest tool; ticket pose mapping; live-agents.test.mjs: bound panda walks to its station and shows real state, bubble and ticket |
| den-v1/02: new call shows bubble, gone after TTL | live-actors.test.mjs: older than the TTL no longer shows |
| den-v1/02: newer call replaces immediately | live-actors.test.mjs: newer tool call replaces the bubble; live-agents.test.mjs: newer live update |
| den-v1/02: residents with no agent show no bubble | live-agents.test.mjs: unbound panda keeps idle wandering; bound agent with no tool yet has empty bubble; applyLive([]) leaves simulation |
| Session end returns panda to idle wandering | live-actors.test.mjs: session ends, no longer bound; live-agents.test.mjs: when the agent's session ends the panda returns to idle wandering; split-off goes away |
| Bridge running plus live cell shows panda at its station | bridge-live-actors.test.mjs: locked ticket in bridge's real /state binds holder's panda at its station; live-agents.test.mjs: main app wires live state |
| Scenery pandas stay simulated | live-agents.test.mjs: 4 scenery pandas stay simulated |
| npm test and smoke:ui pass | Regression gate: 2074 pass, 0 fail; smoke:ui 10 pass |

## Comments

QA pass. All 2074 npm tests pass, 0 skipped. smoke:ui 10 pass. Test files unchanged from specify commit. No assertions weakened. All acceptance criteria have passing tests covering them. Files modified by developer are in scope for ticket (live-actors.mjs adapter, agents.mjs applyLive controller, RestaurantDen.jsx wiring snapshot prop, App.jsx wiring live state).

## Notes

No human verification needed (no designer on this ticket). Bridge does not yet emit snapshot.cells[], so bubble is empty on the real app until that ships (developer noted). Live ticket pandas from controller still render alongside role pandas (possible duplicate, out of scope per ticket spec).
