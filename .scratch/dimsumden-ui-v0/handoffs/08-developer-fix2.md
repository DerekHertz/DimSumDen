```json
{"ticket": "dimsumden-ui-v0/08", "cell": "developer", "mode": "implement", "current_step": "Fix round 2 done and committed; ready for user visual check.",
 "artifacts": ["apps/ui/src/scene/Den.jsx"],
 "decisions": ["Crown ANCHORS side slots moved from x +-0.2 to +-0.4 of Bao's bbox width and y 1.0 to 0.96, so three plushes (scale 0.3) no longer overlap"],
 "failures": [],
 "pending": [{"item": "user visual check of crown spacing in the browser (no browser here)", "owner": "user"}]}
```

## State
Branch `feat/dimsumden-ui-v0-08-scene-from-state` at 5ec88f9. `npm test`: 570 pass, 0 fail.

## What changed
- `Den.jsx` ANCHORS.crown: side slots spread wider and dropped slightly.

## Gotchas
- Not visually verified. If still tight, widen the 0.4 fractions in ANCHORS.crown. Chips stack separately (chip-model), unaffected.
