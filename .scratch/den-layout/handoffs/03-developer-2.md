# den-layout/03 developer handoff 2 (fix round)

## State

```json
{
  "ticket": "den-layout/03-real-agents-drive-the-pandas",
  "cell": "developer",
  "current_step": "Fix round done: role pandas are the only live representation of an agent. npm test 2079 pass, smoke:ui 10 pass (run by scout). In review.",
  "artifacts": [
    "apps/ui/src/review/agents.mjs",
    "apps/ui/src/scene/procedural/controller.mjs",
    "apps/ui/src/scene/procedural/RestaurantDen.jsx",
    "apps/ui/src/review/one-panda-per-agent.test.mjs"
  ],
  "decisions": [
    "Ticket pandas did three things role pandas lacked: click to select (userData.ticketRef on the model, read by RestaurantDen hit), selection glow (cream emissive), and a chip/card anchor (stage.anchors) above the head. All three moved to the role pandas.",
    "agents.mjs: syncLive sets model.userData.ticketRef = live ref (unbind deletes it); new agents.liveFigures() returns Map ref -> {model, panda}; new agents.setSelected(ref) glows that agent's panda.",
    "controller.mjs: new option ticketPandas (default true, so existing controller tests and library use are unchanged). With false, sync plans no cells: no ticket pandas, only frontier baskets and tally. RestaurantDen passes ticketPandas: false.",
    "RestaurantDen frame loop anchors chips from agents.liveFigures() (and drops anchors for refs that left) instead of controller.figures; a useEffect forwards the selected ref to agents.setSelected.",
    "Orchestrator chips now anchor above Bao (role panda); before, orchestrator tickets had no figure and so no chip anchor."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Light verify of the fix round: one-panda-per-agent.test.mjs, npm test, smoke:ui. Not human-verified visually (chip height over the split-off and orchestrator pandas uses the same 4.45 local offset as before).",
      "owner": "qa"
    }
  ]
}
```

## Notes for the orchestrator

- The RestaurantDen wiring (ticketPandas: false) is guarded by a source-match test, since the React component has no unit seam.
- The controller's ticket-panda path still exists behind the default, now unused by the app. Removing it would mean rewriting frontend.test.mjs; left for a cleanup ticket if wanted.
