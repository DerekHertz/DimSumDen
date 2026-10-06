# 08 qa verify handoff

```json
{
  "ticket": "den-v1/08-remove-market-scene",
  "cell": "qa",
  "mode": "verify",
  "current_step": "QA bounce on feat/08-remove-market-scene (1317833): deleted apps/ui/src/overlay/floating-cards.test.mjs, a passing browser test of the live App overlay; everything else checks out.",
  "artifacts": ["feat/08-remove-market-scene @ 1317833"],
  "decisions": [
    "Own runs at 1317833: npm test 1763/1763 pass, 0 fail, 0 skipped; ui:build built; smoke:ui exit 0, 11 PASS, no FAIL.",
    "apps/ui/reachability.test.mjs is byte-identical to the specify commit (git diff 3df1033 HEAD empty); 6/6 green. No .glb tracked (git ls-files '*.glb' empty).",
    "Trimmed live tests (brand, camera-rig, handoffs, tally-stele) only drop checks of deleted modules or deleted file names; accepted. director.test.mjs frozen CLIPS/LOOPS/FACE_FRAMES/PROP_ASSETS copy keeps the mapping assertions; accepted, but the frozen copy is no longer a lockstep check against anything.",
    "Dev-server test retargets (scene-from-state.mjs, apps/ui/index.html) are valid served-file fixtures; accepted.",
    "Bounce reason: floating-cards.test.mjs (33 tests) drives the mounted live App in Chromium (Cards.jsx, Bottom.jsx: Needs you approve/deny keys, zoom, intent, timeline, geometry). I restored it from 3df1033 onto this HEAD and ran it: 33/33 pass with the market modules gone. The developer deleted it only because my walker flagged it as naming no reachable module. It is a test of reachable modules, so criterion 1 keeps it, and deleting it loses the only browser coverage of the approval card."
  ],
  "failures": ["QA bounce: apps/ui/src/overlay/floating-cards.test.mjs deleted but passes and tests live code"],
  "pending": [
    {"item": "Restore apps/ui/src/overlay/floating-cards.test.mjs from 3df1033 (it passes unchanged). It will turn reachability.test.mjs red: that is a specify gap, my walker's keep rule ('names a reachable module') misses browser tests that mount the App through the vite config. qa re-specifies: amend the walker to keep a test that mounts the app (vite createServer with apps/ui/vite.config.mjs or goto of the dev server). Expected test count after: 1763 + 33 = 1796.", "owner": "qa then developer"},
    {"item": "Orchestrator: decide on packages/character-director, stale prose mentions, 125 per developer handoff. Not a QA concern.", "owner": "orchestrator"}
  ]
}
```

## Criterion to test map (verify)

| Criterion | Covered by | Result |
|---|---|---|
| No file unreachable from main.jsx except tests of reachable modules | apps/ui/reachability.test.mjs "no file under apps/ui/src or apps/ui/public is unreachable ..." | green, but the keep rule is too narrow (floating-cards case above) |
| No .glb outside .scratch/ | "no .glb remains in the repo outside .scratch/" | green |
| ui:build, npm test, smoke:ui green, count drop listed | human-verified, run by qa | all green; drop 2037 to 1763 listed in developer handoff |

## Out-of-scope files touched

packages/character-director/src/director.mjs (comment only) and director.test.mjs (frozen contract copy). Listed for security/orchestrator; not judged.
