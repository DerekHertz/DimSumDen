```json
{
  "ticket": "den-scene-v1/11-bigger-cuter-bao",
  "cell": "qa",
  "mode": "specify",
  "current_step": "PART 1 DONE. Ripple tests updated and committed as 40fb260 on feat/11-bigger-cuter-bao-2 (parent WIP 0802dfe). Part 2 (pose, seat, face, patch, reduced-motion, headroom, pill tests) is not started.",
  "artifacts": [
    "branch feat/11-bigger-cuter-bao-2, commit 40fb260 (parent 0802dfeeabc18db04f6ac0e807effbfb2e6bf226)",
    "apps/ui/src/scene/camera-store.test.mjs, camera-rig.test.mjs (TARGET -2.4 to -2.9)",
    "apps/ui/src/scene/iso-projection.test.mjs (TARGET, pixel table, ground pick, cameraConfig, three camera, pan x-limit literals 4.025 desktop and 5.725 phone)",
    "apps/ui/src/scene/horseshoe-layout.test.mjs (targets -3.6/3.6/-5.2/5.2)",
    "apps/ui/src/scene/scene-dressing-framing.test.mjs (pad pixels hand-worked 421.5/1018.5, y 227.2; kiosk centre pixels)",
    "apps/ui/src/scene/default-framing.test.mjs (two new A1 tests: sign anchors at least 4 px outside other kiosks; Tea and Pantry kiosks at least 1 px inside the viewport)",
    "apps/ui/src/scene/grove-layout.test.mjs (T8: stalks at least 0.3 outside Bao's footprint box for seeds 1, 3, 5, 7, 11; stalls in front of the back plane -5.1375)",
    "apps/ui/src/scene/banquet-layout.test.mjs (Tea/Pantry literals shifted 0.3, pads at (+-3.4, -7.65), new pad-to-bamboo clearance test 0.1)"],
  "decisions": [
    "Recipe: applied BAO [0,2.1,-3.3] scale 2.1, kiosks +-3.6, Tea/Pantry +-5.2, pads (+-3.4,-7.65), TARGET [0,0,-2.9] to banquet-layout.mjs and iso-projection.mjs in the worktree only, ran the scene tests, took pixel literals from worldToScreen, then reverted with git checkout. Source is untouched in the commit.",
    "Result under the probe: all part-1 files green. The only scene failures left are source-dependent: 3 Pass perch tests (banquet-layout), 'service bell stands on Bao's crown', roamObstacles rect, handoff arc radius. Full-suite probe was 473 pass, 6 fail.",
    "On the unchanged source the 7 part-1 files give 70 pass, 18 fail; each failure is a constant mismatch (old TARGET, old kiosk x, old pads, old BAO box), none is a syntax or import error.",
    "The two new default-framing A1 tests and the pad-to-bamboo clearance test pass on the old source too (the old layout also met those margins); they are regression guards for the new constants, not red tests.",
    "camera-rig.test.mjs: only the -2.4 literals changed. Its pan limits read panLimits at runtime, and the z-limit 1.872 and 1.085 do not depend on TARGET, so they stay. The x limit literals live in iso-projection.test.mjs."],
  "failures": [
    "Bash heredoc and compound commands (sed with a program containing 'c', cd chains, '; ' chains) refused by the worktree guard as too complex; used the Write tool for scripts under /tmp and plain commands. Genuine guardrail.",
    "Grep tool not available in this session; used grep via Bash.",
    "Context reading was 85k at the commit boundary (cell-start warned the orchestrator was at 74k). The spec-2 and prior handoff reads plus probes cost more than the 80k budget; stopped after the commit."],
  "pending": [
    {"item": "Part 2: write T2 (posed Bao lowest y within 0.02 of 0; needs a node harness that parses apps/ui/public/models/panda.glb with three GLTFLoader.parse after stripping images and textures, builds AnimationMixer, plays sit_still, applies the pose table, reads SkinnedMesh.getVertexPosition; share it as a fixture such as bao-rig.fixture.mjs), T3 0.05 footprint clearance (platform half sizes 1.275 x 0.65, yaw cap 0.52), T5 pill vs shoulder panda rect at least 8 px and pill vs shoulder chips at 1440x900 and 375x667 (pill 1.714 world wide x 0.3 tall at the pads, chips 96x22 via stackChips in chip-model.mjs; pill gap measured 52.8 px and 17.3 px), T6 headroom (orchestrator hat top and chip top at least 8 px inside the top edge at 1440x900, 1280x720, 1366x768, TARGET [0,0,-2.9]), T9 posed-mesh part (lowest vertex of a Pass panda within 0.02 of the posed Bao surface at sit_still and at 0, 1/4, 1/2, 3/4 of breathe, orchestrator slots 0 to 2 via the rail chain, product and architect slots 0 to 2), T10 pose table values and head/body width ratio between 0.78 and 0.86 and not applied to a cook, T11 face rule (half_lidded to content_squint on Bao only), T12 patch softening on a cloned geometry, T13 reduced motion. Interface proposal from the earlier handoff: apps/ui/src/scene/bao-pose.mjs and bao-seats.mjs.", "owner": "qa"},
    {"item": "Developer note for later: Tea and Pantry x +-5.2 and pad z -7.65 in banquet-layout.mjs, TARGET [0,0,-2.9] in iso-projection.mjs, plus the BAO, kiosk, ring, roamObstacles, rail and handoff arc changes the part-1 tests pin. The orchestrator should still flag to the user that the front kiosks sit 2 px inside the 375 edge.", "owner": "developer"}
  ]
}
```

## State

Part 1 of qa specify is committed (40fb260). Worktree clean after the commit. Context passed 80k at the commit boundary, so I stopped; outcome: complete for part 1 scope, part 2 untouched.

## What was read

The prior qa handoff, the designer -2 amendment, and the eight test files edited here (plus narrow greps of banquet-layout.mjs, roam.mjs and iso-projection.mjs).

## Gotchas for part 2

- The worktree guard rejects heredocs, `;` and `&&` chains and sed programs with `c`; Write scripts to /tmp and run `node <path>`.
- Do not re-read the 98-line -2 file; the pending item above lists every remaining test with its numbers.
