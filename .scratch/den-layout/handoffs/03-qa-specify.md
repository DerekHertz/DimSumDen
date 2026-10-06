# den-layout/03 qa specify handoff

## State

```json
{
  "ticket": "den-layout/03-real-agents-drive-the-pandas",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing acceptance tests committed on tests/den-layout-03-real-agents-drive-the-pandas (296697f). 12 tests fail for missing module live-actors.mjs and missing agents.applyLive.",
  "artifacts": [
    "apps/ui/src/review/live-actors.test.mjs",
    "apps/ui/src/review/live-agents.test.mjs",
    "apps/bridge/bridge-live-actors.test.mjs"
  ],
  "decisions": [
    "Adapter module is apps/ui/src/review/live-actors.mjs exporting liveActorsFromSnapshot(snapshot, {now}) and TOOL_BUBBLE_TTL_MS; the ticket named no path, so QA chose it.",
    "Seam into the scene is a new createReviewAgents(...).applyLive(liveActors) controller method (SceneLab.jsx does not exist; RestaurantDen.jsx line 65 is where createReviewAgents is called).",
    "Tool data comes from snapshot.cells[] (ADR 0016 decision 4: ref, cellType, state, lastEventAt, tool{name,summary}), joined to tickets by ref. The bridge does not emit cells[] yet, so the adapter must tolerate it being absent (bubble empty).",
    "Live agent = ticket with a holder lock, not an ended session. Ended = lock released (ticket leaves active set or holder null) or cells[] state terminated/done/failed.",
    "Bound set comes from sceneFromState (den-v1/01); only the 9 cell types bind. Scenery roles (release-manager, knowledge-keeper, docs-writer, stem-cub) are filtered out; debugger is not one of the 9."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Implement live-actors.mjs, agents.applyLive (split-off actors, live-driven state not the preview sim, return to leisure on unbind), and wire App/RestaurantDen to call liveActorsFromSnapshot then applyLive. Re-run the adapter on a timer so the bubble TTL expires without a new snapshot.",
      "owner": "developer"
    },
    {
      "item": "Verify runs npm test and npm run smoke:ui (regression gate, no new smoke assertion specified).",
      "owner": "qa"
    }
  ]
}
```

## Criterion to test map

| Criterion | Test |
| --- | --- |
| Adapter pure, unit tests for bound, split-off, unbound, scenery | live-actors.test.mjs: bound agent maps...; second live agent...split-off; roles with no live agent...; 4 scenery pandas...; each of the 9 cell types...; adapter is pure |
| Bubble shows latest tool, task shows ticket | live-actors.test.mjs: bubble shows latest tool; ticket pose mapping; live-agents.test.mjs: bound panda walks to its station and shows real state, bubble and ticket |
| den-v1/02: new call shows bubble, gone after TTL | live-actors.test.mjs: older than the TTL no longer shows |
| den-v1/02: newer call replaces immediately | live-actors.test.mjs: newer tool call replaces the bubble; live-agents.test.mjs: newer live update |
| den-v1/02: residents with no agent show no bubble | live-agents.test.mjs: unbound panda keeps idle wandering (bubble empty); applyLive([]) leaves simulation |
| Session end returns panda to idle wandering | live-actors.test.mjs: session ends, no longer bound; live-agents.test.mjs: when the agent's session ends the panda returns to idle wandering; split-off goes away |
| Bridge running plus live cell shows panda at its station | bridge-live-actors.test.mjs (real startBridge /state through adapter and applyLive); live-agents.test.mjs: main app wires live state (source check on App.jsx and RestaurantDen.jsx) |
| Scenery pandas stay simulated | live-agents.test.mjs: 4 scenery pandas stay simulated |
| npm test and smoke:ui pass | Regression gate for verify; not a new test |

Human-verified: none. Visual feel of the walk and bubble was not specified (no designer on this ticket).

## Notes

Context at handoff was about 80k tokens (parent context counted); the three big files were not read whole.
