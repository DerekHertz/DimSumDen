```json
{"ticket":"den-scene-v1/01-horseshoe-layout","cell":"developer","current_step":"Approved wider framing committed; in-review pending full QA and built-frame visual check","artifacts":["apps/ui/src/scene/handoff-motion.test.mjs","/tmp/den-scene-v1-01/light.png","/tmp/den-scene-v1-01/dark.png","/tmp/den-scene-v1-01/live-projection.json","apps/ui/src/scene/default-framing.test.mjs","/tmp/den-scene-v1-01/built-framing.json"],"decisions":["Rear kiosk x=±3.3 within approved tolerance","Persistent idle participants count toward counter widths and labels; maximum Steamers occupancy13","Handoff source panda delivers on rear arc then returns to its perch","User approved default framing exception: baseZ13.8/default zoom1, FOV46, x0/y4.2/Euler-0.2 preserved"],"failures":["Red-stage/obsolete geometry test failures corrected","Low-80 temp ancestry failure corrected by main-prescribed isolated fixture directory","Temporary React diagnostic JSON circularity corrected","Live return observation timed out; not retried unchanged","Framing red stage2 expected failures; old camera controller literals3 failures then updated","Board rejected overwrite of previous-claim handoff and stale-handoff release; published new fix-round filename without force"],"pending":[{"item":"Full QA verifies final0455316 implementation, new framing regression, live movement/return and unchanged35 acceptance cases","owner":"qa"},{"item":"Final built-frame visual check after already-approved wider framing proposal","owner":"user"},{"item":"Resume approved foundation batch02 next session; arrange review/PR after user context cutoff","owner":"orchestrator"}]}
```

## State
Implementation committed; automated checks green; in-review with visual/live-return limits explicit.
## What changed
Branch: feat/den-scene-v1-01. Final commit:04553166234d074c0e4e2f98acac766e4fa7accb (approved framing), atop444f674 (layout); base2c41ad2.
16 source/test files changed; horseshoe-layout.test.mjs is unchanged (35 acceptance cases).
Default centres, capped kiosk/slot yaw, fixed idle perches, rear event-driven delivery/return, carried basket.
Renderer and labels count idle roles; widest kiosk includes12 active cells plus idle Scout.
Tests superseded by the approved criterion map are detailed in ticket Comments, including camera/bearing literals.
## Validation and review
Final full suite:1315/1315 pass,0 skipped; focused framing/projection/controller51/51 pass; production build passes; git diff --check clean.
14 new derived-snapshot event -> stepRoamer integration cases cover12 ordered pairs, delivery/return,
expiry, no replay, unrelated/same-station events and reduced motion. Live source QA movement observed.
Final built live scene: Steamers width5.25 (6 active developers + idle Scout), others2.25;
actual canvas aspect1.289, camera(0,4.2,13.8), FOV46/Euler pitch-0.2, zero counter/Bao/table overlaps.
Final desktop1600x900 capture:0 page/console errors. Evidence: /tmp/den-scene-v1-01/live-projection.json.
Images: /tmp/den-scene-v1-01/light.png, dark.png and handoff.png (handoff image predates occupancy correction).
Capture probe: /tmp/den01-capture.mjs; original live motion probe: /tmp/den01-live.mjs.
Standards self-review:0 hard violations; small duplicated occupancy-count loops are a judgment note.
Three new regressions cover approved default, complete roof/platform/post kiosk visibility and counter separation.
Built-framing.json verifies actual built camera and whole-kiosk bounds; max|x|0.9346.
Spec self-review: approved automated scope implemented; final human visual check and live endpoint observation pending.
## Limits and timing diagnosis
Original desktop cropping is resolved by user-approved wider framing; all four full kiosks fit the actual scene.
App and camera-rig share default position/FOV constants; zoom factors stay0.55..1.2 with initialzoom1.
Live motion probe: receiving/returning wait at /tmp/den01-live.mjs:44 timed out after30000ms.
Probe mistakenly supplied timeout options as argument; default30s applied. Frame timing was not recorded.
Renderer caps dt0.1; same QA event reaches receiver after221 frames/7.367 simulated seconds, then returns.
Live start/source identity and stationary Pass/Designer were observed, but live return was not; cause unproven.
No unchanged timeout retry. Browser/bridge cleanup ran in finally. Simulation passing alone is no live verdict.
## Next step
QA verifies0455316; user reviews final built screenshots if needed. Foundation02 continues next session.
## Suggested skills
organism-protocol, tdd, code-review, handoff. Environment incident context: docs/agents/cloud-sessions.md and main-session notes.
## Failed calls
- exec reads: guessed tickets/01 path and ui-fixture.mjs returned ENOENT; actual issues/ path and real bridge used; exploration friction.
- exec handoff-motion red:13 failures first WeakMap input error, then missing delivery; added obstacles input and implemented feature; expected red stage.
- exec obsolete layout suite:10 coordinate/stagger/old-clearance failures; approved criterion-map replacement; expected migration.
- exec initial full:5 failures (4 obsolete geometry; Low-80 Missing expected rejection); geometry updated, main prescribed isolated tmp; platform friction.
- exec browser diagnostic: Converting circular structure to JSON (React Provider); serialized names only; probe friction.
- exec live endpoint probe: page.waitForFunction Timeout30000ms at line44; stopped, offline diagnosis/capture only; unresolved observation.
- exec final-occupancy full:1 obsolete MAX_STALL_CELLS equality failure13 !=12; documented permanent-role occupancy and updated assertion; migration.
- exec searches: no matches for removed helpers/camera pattern returned1; read-only confirmation, no corrective change; ordinary rg semantics.
- exec framing red:2 expected default/frustum failures; implemented approved framing; red stage.
- exec framing focused:3 obsolete camera-distance/pan literal failures; updated approved criterion math; migration.
- exec board handoff: earlier-claim overwrite refused; new01-developer-framing.md filename used; genuine history guard.
- exec board release: no current-claim State block; publish new handoff then release; genuine release gate.
## Worktree receipt
/workspace/dimsumden-dev01: clean after commit; no owned background processes or stashes. Board release follows publication.
