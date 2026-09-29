```json
{"ticket": "dimsumden-ui-v0/08", "cell": "developer", "mode": "implement", "current_step": "Implemented and committed; ready for qa verify.",
 "artifacts": ["apps/ui/src/scene/scene-from-state.mjs", "apps/ui/src/scene/Den.jsx", "apps/ui/src/scene/ChipLayer.jsx", "apps/ui/src/scene/chip-model.mjs", "scripts/log-cell.mjs"],
 "decisions": ["sceneFromState follows ADR 0011 decision 7 rules literally", "Chips are DOM buttons positioned by a rAF projection loop, no drei", "log-cell --model: optional, non-empty, at most 64 chars, key omitted when absent"],
 "failures": [],
 "pending": [{"item": "qa verify, then designer review of framing and chip overlap", "owner": "qa"}]}
```

## State
Branch `feat/dimsumden-ui-v0-08-scene-from-state`, commit 388318c. `npm test`: 567 pass, 0 fail (qa's 35 scene tests green, unedited).

## What changed
- `scene-from-state.mjs`: pure `sceneFromState`, `MAX_PLUSH = 12`.
- `Den.jsx` (in Canvas): Bao at centre plus one cloned panda per cell at its perch anchor (region slots, spill to grass), driven by the character director (pose changes call `setState`, working cells get their prop). Plush click selects ref.
- `ChipLayer.jsx` + `chip-model.mjs` (+ test): status chip buttons per designer spec; `aria-label` is "title, label".
- `App.jsx`: wires snapshot to scene, selection state, empty caption, "+N more in queue". Camera pulled back to [0,1.2,10].
- `scripts/log-cell.mjs --model` + `scripts/log-cell-model.test.mjs` (4 tests).

## Criterion to test map
- AC1: scene-from-state.test.mjs (qa).
- AC2 smoke: ran a throwaway playwright script (scratchpad, not committed) against the bridge on the real board: 12 chips (cap; 2 active + 24 frontier), no console errors, "+14 more in queue" shown. Empty-state and resolved-absent covered by the unit tests only.
- Scope add (--model): log-cell-model.test.mjs.

## Decisions made
- `activeCount` in App.jsx duplicates the active-status list to compute the overflow caption; a shared export from scene-from-state could replace it (left alone to keep the qa-pinned API).
- Bao is fixed at `idle`.

## Next step
qa verify, then designer review.

## Gotchas
- Chips overlap where crown plushes stack (two "Queued" chips at the head); designer to decide spacing.
- Selected plush gets `aria-pressed` on the chip only; no 3D highlight.
- Queue-row selection is not wired (panel is ticket 09); `selected` lives in App state.
- /code-review was not run as a sub-agent; only the manual screenshot and full test run.
