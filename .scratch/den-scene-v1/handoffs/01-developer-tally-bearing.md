```json
{"ticket":"den-scene-v1/01-horseshoe-layout","cell":"developer","current_step":"Narrow Tally bearing bounce corrected and committed; ready for QA recheck","artifacts":["apps/ui/src/scene/camera-default.mjs","apps/ui/src/scene/camera-rig.mjs","apps/ui/src/scene/banquet-layout.mjs","apps/ui/src/scene/tally-stele.test.mjs"],"decisions":["Dependency-free camera-default leaf shares existing constants without a layout/controller circular import"],"failures":["New bearing regression failed as expected before correction: stale -0.2086817623 versus required -0.1651486774"],"pending":[{"item":"Recheck corrected Tally bearing against full QA finding","owner":"qa"},{"item":"Record final visual criterion and complete authorized01 review/merge relay; no new tickets","owner":"orchestrator"}]}
```

## State
Narrow QA bounce corrected; committed and awaiting recheck.
## What changed
feat/den-scene-v1-01 @401c6748b57e0ca25fe8a65035a9df43fca4003c, atop0455316.
Tally yaw now=-atan2(1.8,13.8-3)=-0.16514867741462683 rad.
Existing default camera constants moved to dependency-free camera-default.mjs;
layout/controller share them while camera-rig retains its existing public exports.
Regression relates Tally.rotationY to actual cameraPosition(0,1); obsolete-.209 literal updated.
## Validation
New regression red before fix, green afterward.81 affected layout/framing/Tally/controller tests pass.
Full suite1316/1316 pass,0 skipped. Production build passes. git diff --check clean.
Original35 horseshoe acceptance assertions unchanged. Standards/spec self-review: no new hard findings.
No new captures per dispatch; only Tally yaw changes2.494262°, approved framing/other geometry unchanged.
Prior framing captures/evidence:01-developer-framing.md. QA renderer delivery/return evidence:01-qa-verify.md.
## Next step
QA rechecks the narrow bearing correction, then orchestrator completes authorized01 relay.
## Suggested skills
organism-protocol,handoff. Environment execution details stay in main-session setup notes.
## Failed calls
exec bearing regression: expected red assertion -0.2086817623 != -0.1651486774; corrected shared-camera formula; test-first stage.
## Worktree receipt
/workspace/dimsumden-dev01 clean after commit; no owned background processes/stashes. Release follows publication.
