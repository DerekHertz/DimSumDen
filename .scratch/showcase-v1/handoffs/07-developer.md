# 07 developer handoff: tally stele

```json
{"ticket": "showcase-v1/07-tally-stele", "cell": "developer", "current_step": "implemented; one qa test contradicts the spec, stopped",
 "artifacts": ["apps/ui/src/scene/banquet-layout.mjs", "apps/ui/src/scene/TallyFace.jsx", "apps/ui/src/scene/roam.mjs", "apps/ui/src/scene/roam.test.mjs", "apps/ui/src/scene/tally-face.test.mjs"],
 "decisions": ["TALLY groundY computed from the mound ellipse constants (1.2515)", "roam Tally obstacle removed: stele is outside ROAM_BOUNDS (z0 -3)", "face: three charts stacked down a portrait 336x480 canvas (tally-face.mjs rects are side by side, unused for layout), teal strokes with canvas shadow glow on basic material", "superseded pagoda placement/sight-line tests removed from tally-face.test.mjs and the Tally case from roam.test.mjs"],
 "failures": [],
 "pending": [{"item": "tally-stele.test.mjs test 8 looks wrong: architect#0 perch (screen 0.113, -0.160) falls inside the stele box (x 0.106..0.157, y -0.174..-0.106); architect#1 is at 0.142 and is also inside x but y -0.160 is inside too. Position and sizes are pinned by tests 2-3, so no stele change can satisfy it. The perch is a Pass shoulder cell standing in front of the stele (nearer), so it overlaps rather than being occluded; test 5 already proves nothing sits behind it. Fix: qa relaxes or drops architect from test 8", "owner": "qa"}, {"item": "smoke:ui and browser check", "owner": "user"}]}
```

## State
- ticket: showcase-v1/07-tally-stele
- branch: showcase-v1/07-tally-stele at HEAD, pushed
- next: qa reviews test 8, then verify

## Result
npm test: 786 tests, 780 pass, 6 fail: the 5 expected browser smoke failures plus tally-stele test 8. All other stele tests pass.
