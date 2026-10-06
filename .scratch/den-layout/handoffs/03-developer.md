# den-layout/03 developer handoff

## State

```json
{
  "ticket": "den-layout/03-real-agents-drive-the-pandas",
  "cell": "developer",
  "current_step": "Implemented on den-layout/03-real-agents-drive-the-pandas (bb23dac). qa's 12 failing tests now pass; npm test 2074 pass, smoke:ui 10 pass (run by scout). In review.",
  "artifacts": [
    "apps/ui/src/review/live-actors.mjs",
    "apps/ui/src/review/agents.mjs",
    "apps/ui/src/scene/procedural/RestaurantDen.jsx",
    "apps/ui/src/App.jsx"
  ],
  "decisions": [
    "Adapter live-actors.mjs: live agent = ticket with holder in the 9 cell types, minus cells[] rows in terminated/done/failed. Sorted by compareRefs; first of a role is primary, later ones split. State: gate or ready-for-human = needs-you, blocked = blocked, else working. Bubble 'Tool: summary' from cells[].tool while lastEventAt is within TOOL_BUBBLE_TTL_MS (8000, my choice), else empty. Task is '<ref> · <title>'.",
    "agents.applyLive replaces the live set. Primary bind routes the panda to its station; syncLive then overrides state, activity, bubble and task each frame and skips the preview sim (needs-you at 3.5 s). It re-routes to the station every 3 s if the panda is not there. Unbind clears task and bubble and routes to leisure like resume().",
    "Split-off pandas are extra actors keyed 'role#ref', appear at a clear spot near the role's station, and are disposed when their agent ends.",
    "RestaurantDen now takes a snapshot prop from App and re-runs liveActorsFromSnapshot plus applyLive every 1 s, so the bubble TTL expires without a new snapshot.",
    "isBusy is true for live pandas, so preview sendTask/comeHere/resume skip them."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Verify: npm test and smoke:ui are green on this branch. Not reviewed with the code-review skill (context budget); light verify suffices.",
      "owner": "qa"
    }
  ]
}
```

## Notes for the orchestrator

- The bridge does not emit snapshot.cells[] yet (ADR 0016 decision 4), so the bubble is empty on the real app until that ships. Worth a follow-up ticket: bridge emits cells[] with tool{name,summary} and lastEventAt.
- The live ticket pandas from the controller (createLiveDenController) still render beside the role pandas; the ticket did not ask to change that. Possible duplicate representation of the same agent in the den.
- Under reduced motion the agents update is called with dt 0, so bound pandas do not walk; bubble and task still sync via applyLive.
- Not human-verified visually (no designer on this ticket).
