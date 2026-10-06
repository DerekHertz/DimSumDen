# 08 developer handoff

```json
{
  "ticket": "den-v1/08-remove-market-scene",
  "cell": "developer",
  "current_step": "Done on feat/08-remove-market-scene (1317833): apps/ui/reachability.test.mjs 6/6 green, npm test 1763/1763 green, ui:build and smoke:ui green.",
  "artifacts": ["feat/08-remove-market-scene @ 1317833", "apps/ui/reachability.test.mjs (unedited)"],
  "decisions": [
    "Deleted every orphan qa listed, including the extras (TallyFace, bao-pose, bao-seats, camera-default, grove*, kiosk, pad-chip, dressing, station-hues*, system-theme, asset-cache, plush-lod, gear-object); the import graph agrees none is live.",
    "Deleted apps/ui/src/overlay/floating-cards.test.mjs: a browser test of the old market-scene App that names no reachable module (the walker flagged it).",
    "Deleted whole test files whose subject is gone: bao-placement, bao-pose, bao-seats, dressing, fog-zoom-range, grove-layout, grove, headgear, kiosk-wiring, kiosk, pad-chip, ortho-camera-wiring, scene-dressing-wiring, and the market-extent.fixture.mjs / bao-rig.fixture.mjs helpers.",
    "Trimmed only the dead subtests from live test files: brand.test (TallyFace/Market checks), camera-rig.test (camera-default check), handoffs.test (Market/Den/grove-layout in the -2.4 scan), tally-stele.test (5 subtests reading TallyFace.jsx).",
    "Retargeted dev-server.test and dev-server-bind.test fixtures: .mjs fixture is apps/ui/src/scene/scene-from-state.mjs, html fixture is apps/ui/index.html.",
    "packages/character-director/src/director.test.mjs imported the deleted panda-contract; it now carries a frozen copy of CLIPS, LOOPS, FACE_FRAMES and a reduced PROP_ASSETS so the director mapping is still checked. A comment in director.mjs updated. Not named in the ticket but needed for npm test."
  ],
  "failures": [],
  "pending": [
    {"item": "Verify: run npm test, ui:build, smoke:ui, reachability test.", "owner": "qa"},
    {"item": "Decide whether packages/character-director is now dead (no non-test importer in apps/ui; scene-from-state.test.mjs imports STATES) and whether to file a ticket to retire it. Also stale prose-only mentions of removed files remain in docs/design/*.md (historical), a comment in apps/ci-cd/light-scene.mjs (station-hues-live), tally-face.mjs (TallyFace.jsx) and horseshoe-layout.test.mjs (Market.jsx). Blender build scripts under apps/ui/assets-src/panda still write to apps/ui/public/models; organism-infra/125 owns those.", "owner": "orchestrator"}
  ]
}
```

## Numbers

- npm test before (baseline at 3df1033): 2037 tests, 2033 pass, 4 fail (the 4 reds in reachability.test.mjs).
- npm test after: 1763 tests, 1763 pass, 0 fail. Drop of 274 tests (2037 to 1763); the node:test file-level count dropped 1933 to 1659 top-level entries.
- reachability.test.mjs: 6/6 green. ui:build: 74 modules, built. smoke:ui: all PASS (11 checks).
- Diff: 61 files changed, 28 insertions, 5631 deletions; 4 glbs removed (apps/ui/public is gone entirely).

## Notes

- The panda README (apps/ui/assets-src/panda/README.md) now says the glbs are not committed and the runtime and tests that used them were removed.
- I did not run /code-review (pure deletion plus fixture retargets, covered by the full suite and walker); qa verify is the next check.
