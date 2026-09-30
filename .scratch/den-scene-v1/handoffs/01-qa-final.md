```json
{"ticket":"den-scene-v1/01-horseshoe-layout","cell":"qa","mode":"verify","current_step":"Final QA pass at401c674; narrow Tally finding resolved","artifacts":["apps/ui/src/scene/camera-default.mjs","apps/ui/src/scene/tally-stele.test.mjs"],"decisions":["Reuse prior full verify and browser evidence; independent narrow recheck covers four-file fix"],"failures":["Initial final-QA claim refused while developer held lock; reclaimed only after supported release"],"pending":[{"item":"Complete final design/security review and authorized merge relay","owner":"orchestrator"},{"item":"Record final visual criterion","owner":"designer"}]}
```

## State
QA pass at401c6748b57e0ca25fe8a65035a9df43fca4003c, feat/den-scene-v1-01.
## What changed
Four-file narrow fix after0455316: default camera constants extracted into dependency-free camera-default.mjs;
existing camera-rig exports retain values and interface; Tally bearing uses shared BASE_Z minus own z.
Independent cameraPosition regression checks exact bearing -0.16514867741462683. Previous bounce resolved.
Original35 acceptance assertions unchanged; no weakened assertion or unrelated scope.
## Validation
Independently ran62 Tally/controller/original acceptance/framing tests:62pass,0fail/skip, bounded30s.
git diff --check passes; worktree clean.
Developer reports full1316/1316 and81 affected tests plus production build pass in01-developer-tally-bearing.md.
Prior QA independently ran full1315/1315 before this narrow fix; full criterion map and legitimate test replacements in01-qa-verify.md.
Prior actualbrowser delivery/return frames74/148, minradius3.58469/maxstep0.09, full-kiosk/currentoccupancy projection pass remain applicable.
Optional screenshot timeout was separate from successful movement assertions; no new screenshots/repeated browser probes.
Human visual criterion stays pending designer/user relay; automated QA scope passes.
## Next step
Designer/security/orchestrator finish authorized01 relay.
## Suggested skills
organism-protocol,handoff.
## Failed calls
- exec initial cell-start401c674: ticket already claimed; stopped claim-dependent work, waited developer release, then successful claim; genuine board lock guard.
Earlier initial verify incidents remain listed01-qa-verify.md.
## Worktree receipt
/workspace/dimsumden-verify01 clean; no source/test changes, owned servers, stashes, or locks after release.
