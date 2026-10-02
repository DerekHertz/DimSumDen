# den-iso-v1/04: developer handoff 3 (fog scope)

Branch `feat/scene-dressing04`, on `ef7d73a`. `npm test`: 1673 of 1673 pass. `npm run smoke:ui` was NOT rerun after the fog change (wrap-up at 90% usage).

```json
{
  "ticket": "den-iso-v1/04-scene-dressing",
  "cell": "developer",
  "current_step": "Fog fixed test-first and committed; found and fixed a recursion bug in my own Dressing component. Real-app renders taken at 1440x900 and 375x667; I only looked at them before the fix (1440 after it).",
  "artifacts": [
    {"path": "apps/ui/src/scene/grove.mjs", "note": "Fog(grove-mist, 49, 75) via FOG_NEAR / FOG_FAR"},
    {"path": "apps/ui/src/scene/grove.test.mjs", "note": "fog test: colour grove-mist kept; near > farthest market distance from the rig's camera; near < far finite"},
    {"path": "apps/ui/src/scene/market-extent.fixture.mjs", "note": "test helper: market points, views (default, zoom 0.55 and 1.2, pan limits, both viewports), farthest distance from cameraConfig position (48.18)"},
    {"path": "apps/ui/src/scene/backdrop-dressing.test.mjs", "note": "Backdrop mounts Dressing once; Dressing does not render itself"},
    {"path": "apps/ui/src/scene/Den.jsx", "note": "Bao's material.fog = false hack removed (he is inside fog.near)"},
    {"path": "/tmp/claude-1000/-home-dhertzell-dimsumden--claude-worktrees-agent-orchestrator-continue-74917f/e278220b-9494-4ea3-a9f1-0d60b3eb147e/scratchpad/den-1440x900.png", "note": "render after the fixes"},
    {"path": "/tmp/claude-1000/-home-dhertzell-dimsumden--claude-worktrees-agent-orchestrator-continue-74917f/e278220b-9494-4ea3-a9f1-0d60b3eb147e/scratchpad/den-375x667.png", "note": "render after the fixes, not looked at"},
    {"path": "/tmp/claude-1000/-home-dhertzell-dimsumden--claude-worktrees-agent-orchestrator-continue-74917f/e278220b-9494-4ea3-a9f1-0d60b3eb147e/scratchpad/den-zoom.png", "note": "2x crop BEFORE the recursion fix (no stones or pads), kept for the record"}
  ],
  "decisions": [
    "Fog depth: Euclidean distance from the camera position, the stricter bound (fog uses view depth, which is never larger). Market 31.7 to 48.2 over every view; near 49 gives 0.8 margin. Far grove stalks sit at about 47 to 52 at the default frame, so the mist on them is light (up to about 12%).",
    "Bug found by the render: in 725132b, Dressing returned itself inside its own fragment, so no stones, pads or bamboo were drawn. Fixed; no pure test could see it, so a source test pins it.",
    "Bao's fog=false hack removed since it is now redundant."
  ],
  "failures": [
    "smoke:ui not rerun after the fog and Dressing changes."
  ],
  "pending": [
    {"item": "Run npm run smoke:ui on this branch", "owner": "qa"},
    {"item": "What the 1440x900 render shows (canvas is 1000 px wide because the 400 px sidebar still exists; ticket 07 changes that): no wash-out, kiosks, Tally, Bao and grove all clear; stone ring visible around the front and sides; nothing cropped, though the Steamers kiosk (13 fixture cells) reaches the left edge. Still looks wrong or unchecked: the Library and Drum pads are hidden behind the Steamers 'Blocked' chips and the grove mound, so the pad discs and dashes are not readable and the chips read 'g online' (clipped by the Steamers chips); the chips and sprite chip share a space; the grove is dense and tall behind the market, so the 3 bamboo clusters of the ticket are indistinguishable from it; the 375x667 render was not inspected after the fix.", "owner": "designer"},
    {"item": "Verify criterion 5: the user inspects the den in a browser", "owner": "qa"}
  ]
}
```
