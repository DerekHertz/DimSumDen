```json
{"ticket": "dimsumden-ui-v0/14", "cell": "qa", "mode": "specify", "current_step": "failing tests committed on tests/dimsumden-ui-v0-14-den-backdrop at c454d75; ready for developer",
 "artifacts": ["apps/ui/src/scene/backdrop.test.mjs"],
 "decisions": ["Seam is a new pure module apps/ui/src/scene/backdrop.mjs: buildBackdrop(tokens) -> THREE.Group named 'Backdrop'; applyBackdropTheme(group, tokens) recolours in place; backdropFog(tokens) -> THREE.Fog(surface-100, 8, 20). tokens = { name: '#hex' }", "Token values are parsed from apps/ui/src/styles.css in the test (light :root, dark media block); decor-bamboo tokens not used, neutral tokens only", "Bao bbox from panda.glb POSITION accessor min/max; keep-out checks run on world-space vertices", "Renderer wiring checked by source shape: Den.jsx contains <Backdrop before <Figure id=\"bao\"; Backdrop.jsx exists and has no useFrame"],
 "failures": ["Whole test file fails today with ERR_MODULE_NOT_FOUND for backdrop.mjs (the missing feature); individual tests cannot run red separately until the module exists"],
 "pending": [{"item": "developer: create backdrop.mjs and Backdrop.jsx, render <Backdrop> in Den.jsx before Bao, make tests pass", "owner": "developer"}, {"item": "human-verified: backdrop renders when panda.glb fails (spec test 8) and click on empty backdrop deselects a plush (needs browser; raycast no-hit covered by test 6)", "owner": "designer/user"}, {"item": "human-verified: user visual verdict; frame rate within 5%; chip contrast", "owner": "user"}]}
```

**State**: complete for specify.

# Criterion to test map (test names in backdrop.test.mjs)

Ticket criteria:
- Designer direction approved before specify: done (user picked A); no test.
- Backdrop renders behind scene without covering plushes or chips (scene graph): tests 1, 1b, 1c, 2, 3, 3b, 6.
- User visual verdict: human-verified.

Designer spec tests:
1. Backdrop group before Bao: "1." and "1b."
2. max z <= -1.5: "2."
3. near-band keep-out and tea house height: "3." and "3b." (world-space, derived from Bao bbox)
4. triangles <= 3000, meshes <= 6, no shadows, no emissive: "4."
5. colours equal allowed tokens, none forbidden, both themes: "5." light and dark, plus fog "5b."
6. raycast no hit: "6." (click-deselect itself is human-verified)
7. theme switch keeps uuids: "7."
8. renders when glb fails: human-verified (Den suspends on useLoader; developer must place Backdrop outside that boundary or render it in the fallback)
9. no useFrame: "9." (source check)

Layout bands present: "1c."

# Notes for developer
- Near-band check treats vertices with z in [-2.55, -1.95] and y > 0.01 as upright; the ground plane at y = 0 is exempt.
- Tea house check: vertices with |x| <= 1.0 and z in [-5.1, -4.4] must have y <= 1.1 x Bao height.
- Materials must use the token colour directly (no vertexColors). Raycast on backdrop meshes must be a no-op.
- Run: node --test apps/ui/src/scene/backdrop.test.mjs

**Suggested skills**: organism-protocol, tdd.
**Gotchas**: decor-bamboo tokens have no approved values; using neutral tokens now, tests would need a token-list update when they land.
