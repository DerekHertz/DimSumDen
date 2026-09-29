```json
{"ticket": "showcase-v1/01", "cell": "developer", "current_step": "Implemented and committed; smoke:ui could not run here (no chromium build), needs a run with a browser",
 "artifacts": ["apps/ui/src/scene/banquet-layout.mjs", "apps/ui/src/scene/banquet-layout.test.mjs", "apps/ui/src/scene/Market.jsx", "apps/ui/src/scene/Den.jsx", "apps/ui/src/scene/scene-from-state.mjs", "apps/ui/src/scene/scene-from-state.test.mjs", "apps/ui/src/App.jsx", "docs/adr/0013-banquet-market-layout.md"],
 "decisions": ["perch string is now <station>#<slot> (station: orchestrator, product, architect, steamers, front-of-house, tea, pantry, cubs)", "sceneFromState membership unchanged: frontier tickets still yield a cell (chips, smoke count) and also a lazy susan basket", "camera moved to [0,4.2,11.5] fov 38 to frame the market", "ADR 0013 file was untracked on main; copied into the branch and edited, so it is new in this branch"],
 "failures": ["npm run smoke:ui and 4 smoke tests in npm test fail: playwright wants chromium_headless_shell-1243, only 1194 is installed in /opt/pw-browsers"],
 "pending": [{"item": "Run npm run smoke:ui with a working chromium and eyeball the scene (framing, stall roofs, plush height on counters)", "owner": "qa"}]}
```

**State**: partial. Code, unit tests, ADR done; browser smoke not run.

**What changed**: branch showcase-v1/01-banquet-layout, commit b091193. Unit tests: 13 new (banquet-layout), 4 perch tests updated in scene-from-state. `npm test`: 685 pass, 5 fail, all 5 are browser-launch failures (smoke, smoke --url x3, smoke:ui). `npm run ui:build` succeeds.

**Decisions made**: see State block. Anchor numbers are in ADR 0013 "Anchor model".

**Next step**: qa verify, including a real browser run of smoke:ui and a look at the scene.

**Suggested skills**: tdd, organism-protocol.

**Gotchas**: Plush origin is its centre, so Den lifts each by half its height (footLift); placement returns foot positions. Turning a basket to the stall being worked is not built. /code-review skill was not run as a separate pass.
