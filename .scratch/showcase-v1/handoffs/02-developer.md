# Handoff: showcase-v1/02 low-poly grove: developer

```json
{"ticket": "showcase-v1/02", "cell": "developer", "current_step": "implemented and pushed; awaiting browser check and qa verify",
 "artifacts": ["apps/ui/src/scene/grove-layout.mjs", "apps/ui/src/scene/grove.mjs", "apps/ui/src/scene/Backdrop.jsx", "apps/ui/src/styles.css", "apps/ui/src/scene/grove-layout.test.mjs", "apps/ui/src/scene/grove.test.mjs"],
 "decisions": ["grove tokens are the same in dark theme", "old paper-cut backdrop.mjs and its test removed"],
 "failures": ["5 browser smoke tests fail here: Chromium 1194 vs Playwright 1243"],
 "pending": [{"item": "browser check of look, frame budget with 30 cells, console errors, smoke:ui", "owner": "qa"}]}
```

## State
Done, in-review. Branch `showcase-v1/integration`.

## What changed
- New `apps/ui/src/scene/grove-layout.mjs`: pure seeded layout, `GROVE_COUNTS` (far 30, mid 22, near 12, 3 leaves per mid/near stalk, 14 tufts), mound, `swayAngle` (period 2.8 s, max 0.03 rad, 0 under reduced motion).
- New `apps/ui/src/scene/grove.mjs`: InstancedMesh per part (stalks and node rings per layer, leaves, mound, tufts) plus a grass plane; layers are groups grove-far/mid/near; fog grove-mist 18..40.
- `Backdrop.jsx` rewritten: reads grove-* tokens, sways layers in useFrame, static under prefers-reduced-motion. `Den.jsx` unchanged.
- `styles.css`: grove-* tokens and --dur-breath.
- Removed `backdrop.mjs` and `backdrop.test.mjs`.
- Tests: `grove-layout.test.mjs` (8), `grove.test.mjs` (9).

## Decisions made
Dark theme keeps the green grove (scene background grove-mist in both themes).

## Next step
qa verify in a browser: look, frame budget at 30 cells, console errors, smoke:ui.

## Suggested skills
organism-protocol

## Gotchas
Scene/UI/packages tests: 247 pass. Full `npm test`: 705 pass, 5 fail, all browser smoke (Chromium mismatch). Clearances are unit-tested: everything z < -3.6 (Bao's back), near/mid stalks |x| >= 2.2, mound front behind Bao and below his head.
