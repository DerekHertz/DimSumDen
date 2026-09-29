```json
{"ticket": "dimsumden-ui-v0/08", "cell": "developer", "mode": "implement", "current_step": "Fix round done and committed; ready for re-verify and user visual check.",
 "artifacts": ["apps/ui/src/scene/chip-model.mjs", "apps/ui/src/scene/chip-model.test.mjs", "apps/ui/src/scene/ChipLayer.jsx", "apps/ui/src/styles.css"],
 "decisions": ["Item 1: pure stackChips(items) in chip-model.mjs lifts colliding chips upward by chip height + gap, sorted by ref for determinism; ChipLayer applies it each frame", "Item 3: opacity moved from .chip-idle to .chip-idle .chip-glyph so the label keeps full ink", "Item 2 skipped per user verdict"],
 "failures": [],
 "pending": [{"item": "user visual check of stacked chips in the browser (not run here; no browser)", "owner": "user"}, {"item": "qa verify", "owner": "qa"}]}
```

## State
Branch `feat/dimsumden-ui-v0-08-scene-from-state`. `npm test`: 570 pass, 0 fail (3 new stackChips tests).

## What changed
- `chip-model.mjs`: `stackChips` (width 96, height 22, gap 2 defaults; approximate chip box).
- `ChipLayer.jsx`: projects all anchors, runs `stackChips`, writes positions.
- `styles.css`: dim only `.chip-idle .chip-glyph`.

## Gotchas
- Chip width 96 is an estimate; long labels ("Needs you") may be a little wider. Lifted chips drift away from their plush by 24px per stack step, no leader line.
- Not visually verified in a browser.
