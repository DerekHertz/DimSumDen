```json
{"ticket":"den-scene-v1/01-horseshoe-layout","cell":"qa","mode":"verify","current_step":"Full verify completed; bounce for Tally bearing stale after approved framing","artifacts":["/tmp/qa-verify01-full-home.log","/tmp/qa01-browser.json","/tmp/qa01-projection/built-framing.json"],"decisions":["Old free-roaming and layout tests were legitimately superseded; original35 unchanged","Controlled real renderer delivery/return evidence distinguished from overall screenshot harness exit1"],"failures":["Initial wrong TMPDIR suite failed platform ancestry-sensitive fixtures; corrected supported isolated path passes","Optional screenshot after completed renderer assertions timed out30000ms","Tally face-camera bearing retains old default distance"],"pending":[{"item":"Correct Tally default-camera bearing and regression for approved camera; rerun affected checks","owner":"developer"},{"item":"Final built-frame visual verdict","owner":"user"},{"item":"Continue deferred02 and reviews after context cutoff","owner":"orchestrator"}]}
```

## State
QA bounce: one narrow correctness mismatch; all other automated criteria pass.

## What changed
Reviewed feat/den-scene-v1-01 at04553166234d074c0e4e2f98acac766e4fa7accb; no product/test edits.
Diff from specify2c41ad29c56d8431b847fa964043efaa293d771e touches16 layout/motion/rendering/camera/test files.
Original horseshoe-layout.test.mjs byte-for-byte unchanged; no weakened acceptance assertion.
Old coordinates, stagger, shoulder-gap and roaming lifecycle replacements match approved ticket scope.
Den→RoamFigure passes derived live events to stepRoamer; Market applies yaw and counted occupancy.

## Finding
apps/ui/src/scene/banquet-layout.mjs:20 retains -atan2(1.8,8.5), based on originalcamera z11.5.
Approved camera z13.8 and Tally z3 require -atan2(1.8,10.8)=-0.1651486774; actual=-0.2086817623 (2.494262° error).
apps/ui/src/scene/tally-stele.test.mjs:28 asserts obsolete -0.209, so green tests miss face-camera scope.
Correct the bearing/regression without changing35 acceptance assertions.

## Validation and criterion map
Full npm test:1315/1315 pass,20 suites,0 skipped/cancelled/todo;47.692s, bounded180s.
Production ui:build passes; warnings: existing browser-externalized node:fs and1175kB bundle.
git diff --check passes.
Targets:6 horseshoe target cases; yaw:every-kiosk capped yaw; projection:counter rectangle case.
Idle:14 role/reduced-motion cases for60seconds; safe travel:12 continuous rear-route cases.
Labels:approved centre case. Event movement:14 deriveHandoffs→stepRoamer cases incl12 ordered pairs, delivery/return/expiry/no replay.
Approved framing:3 default-framing cases testcamera, complete kiosks and counter separation incl7-slotSteamers.
User visual criterion remains human-verified pending final user judgment.
Independent builtbrowser currentoccupancy: Steamers4.5, otherkiosks2.25;camera(0,4.2,13.8),FOV46,aspect1.289.
/tmp/qa01-projection/{built-framing,live-projection}.json: allfourfullkiosks inside frame,nooverlaps/errors;commandexit0.
Developer5.25-wide capturedoccupancy remains covered by unchanged7slot framing regression.
Controlled realbrowser: demo snapshots advance through React hooks; supported R3F never/advance invokes actual useFrame withdt0.1.
ActualQA source delivers toSteamers frame74,returns exacthome idleframe148(14.8 simulatedseconds).
Minimumradius3.58469,maxplanarstep0.09;Pass/Designer unchanged;0console/pageerrors.
/tmp/qa01-browser.json records assertions completed before optional screenshot timedout.
This is actual rendererobject delivery/return evidence, not realtime speed validation or overall browserharness success.

## Next step
Developer fixes Tally bearing and regression; QA rechecks narrow fix before review relay.
## Suggested skills
organism-protocol,tdd,handoff.
## Gotchas
Reusable saved environment config carries fixture configuration; docs/agents/cloud-sessions.md may be stale.
## Environment issues
Optional screenshot: page.screenshot Timeout30000ms after frameloop never; cause unproven; no unchanged retry.
Movement JSON already written; browser/bridge closed in finally. Existing developer captures available for visual verdict.
## Failed calls
- exec rg apps/ui/*test*: No such file or directory exit2; switched exactscene paths; exploration friction.
- exec initial npm test wrongTMPDIR: exposure isDenied true!==false; jev --tests path denied; exactsupported isolatedfixture run1315pass; environment ancestry friction.
- exec browser screenshot: Timeout30000ms at /tmp/qa01-browser.mjs:23; no retry; separate geometryprobe passed; unresolved optionalcapture friction.
## Worktree receipt
/workspace/dimsumden-verify01 clean; no source/test changes, stashes or owned background processes.
