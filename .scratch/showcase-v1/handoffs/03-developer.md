# Handoff: showcase-v1/03 Today's board: developer

```json
{"ticket": "showcase-v1/03", "cell": "developer", "current_step": "implemented and pushed; awaiting browser check and qa verify",
 "artifacts": ["apps/ui/src/scene/board-face.mjs", "apps/ui/src/scene/board-face.test.mjs", "apps/ui/src/scene/BoardFace.jsx", "apps/ui/src/metrics-state.js", "apps/ui/src/scene/ChipLayer.jsx", "apps/ui/src/scene/banquet-layout.mjs", "apps/ui/src/App.jsx", "apps/ui/src/panel/Dashboard.jsx", "apps/ci-cd/smoke-ui.mjs"],
 "decisions": ["the Dashboard stays visible in the panel; opening the board scrolls to it and focuses its heading", "the board stands at x 2.9, z 3.9 on tall posts so it does not hide the Pantry cells", "smoke-ui.mjs expectations changed: 3 cell chips, board chip excluded"],
 "failures": ["browser smoke cannot run here (Chromium 1194 vs Playwright 1243), so the smoke:ui edit is unverified"],
 "pending": [{"item": "browser check of the board (look, click, Enter on the chip, panel scrolls to Pipeline) and run smoke:ui", "owner": "qa"}]}
```

## State
Done, in-review. Branch `showcase-v1/integration`.

## What changed
- `board-face.mjs` (pure): view-model over `dashboardModel`: title "Today's board", three panels with short titles Resolved, Tokens, Spills (incidents read as spills on the face only), last 8 windows and top 4 rows, layout in face fractions. `BOARD_ARIA_LABEL` is "Today's board: open the dashboard".
- `banquet-layout.mjs`: `TODAYS_BOARD` (x 2.9, z 3.9, slate bottom 1.9). Tests: clear of the cub basket, cub row and Pantry; the sight line from the default camera to the Pantry's cells passes under the slate.
- `BoardFace.jsx`: slate on posts with a pagoda roof, canvas-texture face, click opens the dashboard.
- `ChipLayer.jsx`: a `Today's board` chip (class `chip-board`) anchored above the board is the keyboard route (Enter or click).
- `App.jsx`: `useMetrics` (metrics-state.js) is one shared /metrics fetch for the board and the Dashboard; `openDashboard` scrolls to the Pipeline section and focuses its heading. `Dashboard.jsx` now takes `metrics`, `failed`, `onRetry` props.
- `apps/ci-cd/smoke-ui.mjs`: expected cell chips 3 (queued tickets have no panda since 04), board chip excluded from the count.

## Next step
qa verify in a browser and run `npm run smoke:ui`.

## Gotchas
- The ticket's "opens the existing Dashboard": the Dashboard is always in the panel, so "open" is scroll and focus, keeping the smoke check for charts valid.
- Face charts are drawn on a canvas texture; not unit-testable beyond the view-model.
- 285 of 289 scene/UI/packages/smoke tests pass; the 4 failures are the browser smoke tests.
