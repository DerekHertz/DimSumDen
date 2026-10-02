# den-scene-v1/07: developer handoff 5 (haze fix round)

Branch `feat/floating-cards07` at `dd3443a` (merge `6a0e959` of origin/main, then one test commit). `npm test`: 1744 of 1744 on the last run (a first run showed 2 unrelated reds, `dev-server-bind` port test and the Codex rate-limit test; both green alone and on two reruns, so environment flakes). `npm run smoke:ui`: 10 of 10 PASS.

## Cause of the haze

The branch predated den-iso-v1/04's fog fix. At f787331 `groveFog` was `new THREE.Fog(grove-mist, 18, 40)`. The orthographic camera sits 40 units from its look-at target, and the market is 31.7 to 48.2 units from the camera, so every kiosk, the table and the Tally were 60 to 100% fogged to the `grove-mist` colour: a whole-scene wash. Bao alone escaped, because `Den.jsx` set `material.fog = false` on him. The merge brings 04's `Fog(grove-mist, 49, 75)` (`FOG_NEAR`/`FOG_FAR` in `grove.mjs`) and removes that hack. No 07 change caused it: 07's overlays are CSS only.

Before render (f787331, built and rendered with real draws): the scene is a flat pale green with ghost kiosks. After render (merged): saturated kiosks, bamboo, stones, pads; no wash in light or dark.

## The pale shape on Bao's head

It is the orchestrator panda, the Pass rail and the service bell. `banquet-layout.mjs` puts the Pass station on Bao's crown (`PASS.orchestrator` frac 0.96, `RAIL`, `BELL`), with product and architect on his shoulders (the two pandas with glasses either side). Because Bao ignored fog and these did not, they were fogged to near the mist colour while Bao stayed opaque, so they read as a pale ghost over his head. With the fog fixed they draw as a chef-hat panda, a wooden rail and a yellow bun bell. It is by design (ADR 0013 Pass perch), not a bug; nothing to fix or ticket.

## Fog bound across the zoom range

`camera-store.mjs` clamps through `clampZoom` (0.55 to 1.2, same constants as `market-extent.fixture.mjs`), and the rig clamps the target every frame. grove.test.mjs (market-extent fixture) still passes: farthest market point 48.18 from the camera, `FOG_NEAR` 49. I added a guard test, `apps/ui/src/scene/fog-zoom-range.test.mjs`, that drives the real store (wheel, pinch, + and -, levels 1 to 3, every station pill, pan corners) through `clampTarget` at six canvas sizes (320x480 to 2560x1440; 07 makes the canvas the whole window) and asserts every market point stays inside `FOG_NEAR`. It passes (it is a guard: green on first run, since the merge already fixed the cause). Real wheel zoom-out (1.2) and zoom-in (0.55) renders are clear.

## Renders (real draws, fixture board, bridge + built UI)

Scratchpad `/tmp/claude-1000/-home-dhertzell-dimsumden/42fefd50-55ba-48ef-826e-678b788978a4/scratchpad/`:
- `before-{light,dark}-{1440x900,375x667}.png` (f787331, hazed)
- `after-{light,dark}-{1440x900,375x667}.png` (merged, default frame)
- `after-zoomout-{1440x900,375x667}.png`, `after-zoomin-{1440x900,375x667}.png` (light)
- `before-head-crop.png`, `after-head-crop.png` (3x crop of Bao's head)

I looked at before-light-1440, after-light/dark-1440, after-light/dark-375, after-zoomout-1440 and after-zoomin-1440. I did not look at after-zoomout/zoomin-375 or before-dark and before-375.

```json
{
  "ticket": "den-scene-v1/07-sidebar-overlays",
  "cell": "developer",
  "current_step": "Merged origin/main (fog fix from den-iso-v1/04) into feat/floating-cards07; haze gone in real renders (light and dark, 1440x900 and 375x667, plus zoom extremes); pale head shape explained (orchestrator on the Pass perch, fogged); fog guard test added; npm test and smoke:ui green.",
  "artifacts": [
    {"path": "apps/ui/src/scene/fog-zoom-range.test.mjs", "note": "guard: store extremes x six canvas sizes stay inside FOG_NEAR"},
    {"path": "/tmp/claude-1000/-home-dhertzell-dimsumden/42fefd50-55ba-48ef-826e-678b788978a4/scratchpad/after-light-1440x900.png", "note": "default frame after the merge"},
    {"path": "/tmp/claude-1000/-home-dhertzell-dimsumden/42fefd50-55ba-48ef-826e-678b788978a4/scratchpad/before-light-1440x900.png", "note": "default frame before (hazed)"}
  ],
  "decisions": [
    "Cause is the old Fog(18, 40) on an orthographic camera 40 units away; fixed by the merge, no new scene code.",
    "Pale head shape is by design (Pass perch) and was only a fog artefact; no ticket needed.",
    "Did not run the code-review skill: the only new code is one test file."
  ],
  "failures": [
    "First npm test run: 2 reds (dev-server-bind port test, Codex rate-limit test), both green in isolation and on two reruns."
  ],
  "pending": [
    {"item": "Designer re-look at light and dark, desktop and mobile, for the user's haze verdict; also 04's open designer items (pad chips)", "owner": "designer"},
    {"item": "qa light verify of the merge (specify tests untouched)", "owner": "qa"},
    {"item": "Out of scope, seen in renders: at 375x667 the 'Blocked' chip is cut off at the left edge; at zoom-in the pad labels ('Library / Drum coming online') are huge and clipped at the top", "owner": "orchestrator"}
  ]
}
```
