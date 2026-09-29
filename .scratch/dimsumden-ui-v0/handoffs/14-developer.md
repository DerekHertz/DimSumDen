```json
{"ticket": "dimsumden-ui-v0/14", "cell": "developer", "mode": "implement", "current_step": "implementation done, 14 of 15 tests pass; stopped on a wrong qa test (test 2 precondition)",
 "artifacts": ["apps/ui/src/scene/backdrop.mjs", "apps/ui/src/scene/Backdrop.jsx", "apps/ui/src/scene/Den.jsx"],
 "decisions": ["backdrop.mjs: 5 meshes, one per neutral token (surface-000, surface-300, line, line-strong, ink-faint), raycast no-op, flat Lambert", "Den now renders <Backdrop/> outside a new Suspense around DenFigures (the old Den body), so the backdrop does not wait on panda.glb", "Backdrop.jsx reads --tokens from CSS, sets scene.fog and scene.background, recolours on prefers-color-scheme change", "Tea house kept under 1.1 x Bao height (body 0.6 + 3 eaves + ridge to y 0.98), smaller than the spec's 1.2 high, forced by test 3b"],
 "failures": ["backdrop.test.mjs test 2 fails on its own precondition: assert 0.9 x Bao depth < 1.5, but depth = 1.753 so 0.9 x depth = 1.578. Not related to backdrop code; every backdrop mesh max z is <= -1.5 (the per-mesh assertions after it were not reached)"],
 "pending": [{"item": "qa: fix test 2 precondition (drop it or compare against the anchor z properly), then developer reruns", "owner": "qa"}, {"item": "frame-time with/without backdrop, npm run ui visual check instructions", "owner": "developer"}, {"item": "human-verified: glb failure render, click deselect, visual verdict", "owner": "user"}]}
```

**State**: blocked on a wrong test. Tests 1-1c, 2 (body not checked), 3-9 pass; only the test 2 precondition fails.

Commit on feature/dimsumden-ui-v0-14-den-backdrop. Not done: frame-time measurement and visual check notes, deliberately, until the test is fixed.
