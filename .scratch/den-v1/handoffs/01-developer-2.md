# den-v1/01 developer handoff 2 (batch D1 fix round, PR #151, branch codex/procedural-den-frontend @ 0604c76)

```json
{
  "ticket": "den-v1/01-resident-pandas-take-over",
  "cell": "developer",
  "current_step": "Fix round done: the three qa test gaps are covered and one real AC3 gap (failed state) is fixed. npm test 1984 pass, 0 fail, 0 skipped. Pushed to the PR #151 branch. Ready for qa verify.",
  "artifacts": [
    "codex/procedural-den-frontend@0604c76",
    "apps/ui/src/scene/procedural/frontend.test.mjs",
    "apps/ui/src/scene/chip-model.mjs",
    "apps/ui/src/scene/chip-model.test.mjs",
    "apps/ui/src/styles.css"
  ],
  "decisions": [
    "AC1: new test counts visible pandas per role (resident roamer or pad crew, plus bound figures) for product, architect, developer, scout, designer, qa, security, and checks Bao is the orchestrator. Herald has no resident in the den (den-scene.mjs residentRoles has 7 roles plus Bao); I did not add one, that is a scope call for the orchestrator or user.",
    "AC2: new test syncs [dev1], [dev1,dev2], [dev2], [dev1], [] and asserts the developer panda count 1, 2, 1, 1, 1 (resident), that ending dev1 removes only its figure (dev2's panda object is retained), and that the split-off stands in a different spot.",
    "AC3: real gap found, not only a test gap. chip-model.mjs had no entry for failed, so a failed cell showed as Queued. Added failed (word Failed, tone failed). Chip glyph shapes are now distinct per state in styles.css: working circle, needs-you rounded square, blocked sharp square with dashed border, failed triangle with dotted border, done diamond. chip-model.test.mjs reads the stylesheet and asserts five distinct words, tones and glyph shapes. The 3D poses are asserted pairwise distinct for all five states (poseFor), but done vs failed differ only by small head and root angles; the chip is the shape or icon cue, the pose is supporting.",
    "Seam deviation (pure sceneFromState binding vs the controller-based binding) is untouched; behavior is tested through createLiveDenController. Still the orchestrator's call.",
    "Test helper: withDen and canvasDocument moved from frontend.test.mjs into procedural/den-test-helpers.mjs so walk.test.mjs can share them."
  ],
  "failures": [],
  "pending": [
    {"item": "qa verify of batch D1 (full, since qa did not specify)", "owner": "qa"},
    {"item": "Herald has no resident panda; decide whether the den should model it", "owner": "orchestrator"},
    {"item": "Old scene files (Den.jsx, Market.jsx, CameraRig.jsx, camera-rig.mjs) are unreferenced by App.jsx but still tested; clean up in a separate ticket", "owner": "orchestrator"}
  ]
}
```
