```json
{"ticket":"showcase-v1/01-banquet-layout","cell":"developer","current_step":"fix round done, pushed 1d6dd26, awaiting user browser check","artifacts":["apps/ui/src/scene/CameraRig.jsx","apps/ui/src/scene/camera-rig.mjs","apps/ui/src/scene/stall-roof.mjs","apps/ui/src/scene/Market.jsx","apps/ui/src/scene/Den.jsx","apps/ui/src/App.jsx"],"decisions":["table top visual radius 1.8 kept out of TABLE (qa pins 1.3)","Bao ignores fog via material.fog=false"],"failures":["5 browser smoke tests fail: Chromium 1194 vs 1243"],"pending":[{"item":"User browser check; update ADR 0013 table radius","owner":"orchestrator"}]}
```

## State
Done, awaiting user browser check.

# Handoff: showcase-v1/01 developer, fix round

Branch `showcase-v1/01-banquet-layout`, commit 1d6dd26, pushed.

## Done (all four user asks)
- Table: flat round top (radius 1.8, 0.1 thick) on four short legs; lazy susan is a thin disc (r 1.15) on top; baskets raised to sit on it. `TABLE` in banquet-layout.mjs is unchanged (radius 1.3 is still the anchor/qa-pinned value); the visual radius is a local const in Market.jsx. ADR 0013 still says table radius 1.3: propose an update.
- Camera: `CameraRig.jsx` (in Canvas) plus pure `camera-rig.mjs`. Pan x only within +-5 by drag or ArrowLeft/Right; zoom (dolly z, factor 0.55..1.2) by wheel or +/-. Scene `<main>` is now focusable (tabIndex 0, focus ring). Reduced motion: snaps, no easing.
- Stall roofs: four posts at the stall corners reach a hip roof with upturned eaves; roof corners equal post tops (`stall-roof.mjs`, custom BufferGeometry, no scale/rotate skew).
- Fog: Bao's cloned materials set `fog = false` (Den.jsx). Backdrop fog unchanged (qa test pins near 8, far 20).

## Tests
New unit tests: camera-rig.test.mjs (8), stall-roof.test.mjs (5), written red first, green now. `npm test`: 698 pass, 5 fail; all 5 are browser smoke tests (`smoke --url` x3, `smoke:ui`, `smoke`) that need Chromium 1243 (env has 1194). `vite build` succeeds. Nothing verified in a browser.

## For the user to check
Drag/arrow/wheel/+- feel and limits (PAN_LIMIT 5, zoom 0.55..1.2 in camera-rig.mjs); Bao crisp at max zoom-out; table overlapping Bao's belly slightly (top radius 1.8 at origin, Bao front at z about -1.2); roof looks.

## Notes for orchestrator
Chips are projected from stage.camera each frame, so they follow pan/zoom. Camera keys act when the scene or a chip has focus.
