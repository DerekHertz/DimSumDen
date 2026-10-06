# den-layout/02 qa specify handoff

```json
{
  "ticket": "den-layout/02-scene-becomes-the-den",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed on tests/den-layout-02-scene-becomes-the-den at ece618f; each fails for a missing feature, not a setup error.",
  "artifacts": [
    "branch tests/den-layout-02-scene-becomes-the-den, commit ece618f632f9a68cb9121d95ff389f5a3d149f9c (base 891242b)",
    "apps/ui/den-scene-mounted.test.mjs (new)",
    "apps/ui/reachability.test.mjs (first test rewritten)",
    "apps/ui/src/review/agents.test.mjs, apps/ui/src/review/review.test.mjs, apps/ui/src/scene/procedural/restaurant.test.mjs (verbatim from origin/codex/lively-den-scene-lab c0ea147)"
  ],
  "decisions": [
    "Root cause of PR #162's red tests, found by porting its files into a scratch tree: restaurant.mjs imports ../headgear.mjs and ../gear-object.mjs, and headgear.mjs imports ./station-hues.mjs. den-v1/08 deleted all three from main. With them restored, all 20 tests in the three files pass in about 5 s, so the 3-minute CI timeout is not slowness in these tests.",
    "headgear.mjs is on the reachability 'market scene modules are gone' list at src/scene/headgear.mjs, so it cannot simply come back there. The developer must re-home headgear, gear-object and station-hues (for example under src/scene/procedural/) or rewrite dressCharacter. That choice is left to the developer; no test fixes a location.",
    "The three PR test files are committed unchanged, so 'pass on main' is pinned and light verify can diff them.",
    "reachability.test.mjs test 1: dropped the Den.jsx-reachable assertion, added reachability of nine ported modules (den-scene, restaurant, agents, layout, leisure, construction-pads, landscape, site-plan, walking-panda) and Den.jsx NOT reachable. Kept the App.jsx and scene-from-state reachable assertions. The host component name (SceneLab or other) is not dictated.",
    "No test dictates the host component. The browser test only checks which modules Chromium fetched."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Make the tests pass. Port the PR #162 scene and review modules, re-home the deleted headgear closure, mount the scene from main.jsx and remove Den.jsx and the standalone review build. See the criterion map and risks below.",
      "owner": "developer"
    }
  ]
}
```

## Criterion to test map

| Criterion | Test |
|---|---|
| 1. app opens PR #162's scene; no path renders the old den | `apps/ui/reachability.test.mjs` "main.jsx reaches the ported restaurant scene and not the old den" (static graph); `apps/ui/den-scene-mounted.test.mjs` "opening the app loads PR #162's scene modules, never the old Den.jsx, and mounts a canvas without a page error" (live Chromium via vite). Visual fidelity to PR #162 is `human-verified` (user signed off visuals 2026-10-06). |
| 2. review:dev, review:build, vite config gone; scripts reference no removed file | `den-scene-mounted.test.mjs`: "review:dev and review:build scripts are gone", "the standalone review build's files are gone", "every file path a package.json script names exists", "live docs do not tell anyone to run the removed review scripts" |
| 3. den-v1/08 reachability test passes | all of `apps/ui/reachability.test.mjs` (existing tests 2 to 7 unchanged, test 1 amended as above) |
| 4. PR #162's three test files pass within CI's limit | the three files themselves, plus `den-scene-mounted.test.mjs` "PR #162's agents, review and restaurant test files pass on main, in one process under 90 s" (also asserts 20 tests, 0 fail, 0 skipped) |
| 5. npm test and smoke:ui pass | `npm test` and the existing `npm run smoke:ui` script, run by verify; not a new test |

## Red state at ece618f

- 3 PR test files: fail with ERR_MODULE_NOT_FOUND (layout.mjs, walking-panda.mjs). Right reason: modules not ported.
- reachability test 1 and the two den-scene-mounted tests (PR files run, live mount) fail on assertions about missing modules.
- The four package.json and files tests in den-scene-mounted.test.mjs PASS now. They are guards: the removed build is not on main yet, and they fail if the port brings it in. Expected, not a defect.
- Other reachability tests (2 to 7) pass on main now and must stay green.

## Risks for the orchestrator and developer (found, not decided)

1. floating-cards.test.mjs asserts "no aside" and fixed data-overlay roots on the live App. PR #162's SceneLab.jsx is a full page with sidebar `<aside>`s. The developer must mount only the scene world inside App's Canvas, not SceneLab as is. Keep App.jsx overlays (Cards, ChipLayer, tally) so floating-cards and tally-expand still pass.
2. apps/ci-cd/smoke-ui.mjs has checks coupled to the old den: kiosk sign camera fit at two viewports, wheel zoom, drag pan, and "walk: Enter the den". Criterion 5 requires smoke:ui to pass, but these may not hold in the new scene (walk mode returns in ticket 04). Open scope question: may 02 retarget or drop those smoke checks? I did not decide this. If the developer must edit smoke-ui.mjs, the orchestrator should confirm.
3. Reachability test 2 will orphan walk/explorer/controller modules and their tests if the new scene stops reaching them (04 re-wires walking). The developer must delete them or keep them reachable; the orchestrator should check that against 04's plan.
4. The PR branch is based on an old main (merge-base c689902). Its diff against main shows unrelated reverts. Port only the 28 PR-owned files (git diff 891242b...origin/codex/lively-den-scene-lab), never merge the branch.

## Context

Final context about 111k, over the 80k line, because the PR's SceneLab.jsx and test files were large reads. The work was already complete and committed, so I ended rather than leaving WIP.
