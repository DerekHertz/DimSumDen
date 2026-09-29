# 07 tally-stele: developer fix round

Both findings addressed on branch showcase-v1/07-tally-stele. Finding 1 root cause is NOT confirmed (no browser in cloud); the fix removes the two runtime paths I could find. The user must re-check in the browser.

```json
{
  "ticket": "showcase-v1/07-tally-stele",
  "cell": "developer",
  "current_step": "fix committed and pushed; in-review",
  "artifacts": [
    "apps/ui/src/scene/banquet-layout.mjs (tallyAnchor)",
    "apps/ui/src/scene/ChipLayer.jsx",
    "apps/ui/src/scene/TallyFace.jsx",
    "apps/ui/src/scene/tally-pill.test.mjs"
  ],
  "decisions": [
    "Tally pill anchor is now a pure function tallyAnchor(), projected directly by ChipLayer, instead of a stage.anchors entry set in a React effect (could go stale, e.g. an old anchor surviving hot reload)",
    "ChipLayer calls camera.updateMatrixWorld() before projecting: CameraRig moves the camera in useFrame, so the rAF loop read last frame's matrix and chips lagged during a pan",
    "Face fill is stone-deep #3d403d; tablet mesh stays stone"
  ],
  "failures": [
    "Could not reproduce the offset: code-level projection with real THREE at 1280x800 gives the pill centred and about 30px above the tablet top at pans 0, 2, -3 (new unit test). stackChips only moves y, so it is not the cause.",
    "No debugger dispatch tool available in this session"
  ],
  "pending": [
    {"item": "Browser re-check: pill centre within 10px of stele centre x, 0-40px above tablet top, at default camera and after a pan", "owner": "user"},
    {"item": "If the offset persists, suspect stale dev build or stage.size vs canvas size; inspect in devtools", "owner": "debugger"},
    {"item": "TallyFace still takes an unused stage prop; remove in a cleanup", "owner": "developer"}
  ]
}
```

Tests: tally-pill.test.mjs (3 cases) went red then green. `npm test`: 783 pass, 5 fail (the expected cloud browser smoke failures).
