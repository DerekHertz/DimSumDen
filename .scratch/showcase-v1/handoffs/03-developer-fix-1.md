# Handoff: showcase-v1/03 fix round 1: developer

```json
{"ticket": "showcase-v1/03", "cell": "developer", "current_step": "browser-check fixes pushed; awaiting qa verify",
 "artifacts": ["apps/ui/src/scene/TallyFace.jsx", "apps/ui/src/scene/tally-face.mjs", "apps/ui/src/scene/tally-face.test.mjs", "apps/ui/src/scene/banquet-layout.mjs", "apps/ui/src/scene/Market.jsx", "apps/ui/src/scene/scene-from-state.mjs", "apps/ui/src/scene/station-labels.mjs", "apps/ui/src/App.jsx", "apps/ci-cd/smoke-ui.mjs"],
 "decisions": ["Today's board renamed Tally everywhere (files, identifiers, label, aria name, .chip-tally, smoke-ui exclusion); spills stays on its face", "the idle Pass stand-in is added in App via withPassCell, not in sceneFromState, so chips and the smoke chip count are unchanged"],
 "failures": [],
 "pending": [{"item": "browser re-check of the six fixes", "owner": "qa"}]}
```

## State
Done, in-review (also covers 04 and 05 follow-ups). Branch `showcase-v1/integration`.

## What changed
1. Opening Tally scrolls only the panel's own container (`.panel`) and focuses the heading with `preventScroll`; no `scrollIntoView`, so the page never scrolls (a test enforces it).
2. Tally moved to x 2.9, z 0.8 beside the table between Bao and the back-right stall, slate bottom 2.35. Unit tests: clearance from Bao and his shoulder cells, the table, Front of House and Pantry stalls at six cells, and the cub basket; the sight line to Front of House cells passes under the slate.
3. Service bell seated on a new Pass rail (`RAIL`, `BELL` in banquet-layout) at the orchestrator's crown height.
4. `withPassCell` (scene-from-state) adds an idle synthetic orchestrator when none is active; Den renders it (not selectable), chips skip it.
5. Back-stall platforms are stone (`#b3a892`), not ink.
6. A "Cubs" rice-paper pill floats above the cub basket (station-labels).
7. Rename to Tally throughout.

## Gotchas
Full `npm test`: 758 pass, 5 fail (browser smoke only, not runnable here).
