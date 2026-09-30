```json
{"ticket":"den-scene-v1/01-horseshoe-layout","cell":"qa","mode":"specify","current_step":"Acceptance tests committed; developer implementation and real scene integration pending","artifacts":["apps/ui/src/scene/horseshoe-layout.test.mjs"],"decisions":["Approved stallYaw(station) and handoffPath(fromStation,toStation) test seams","Rear horseshoe geometry clarified by designer and recorded in ticket Comments"],"failures":["Initial cell-start npm ci failed before claim; supported existing cache configuration restored installation","Read guessed market-sightlines.test.mjs path failed ENOENT","Acceptance suite fails intentionally for missing feature"],"pending":[{"item":"Implement horseshoe behavior, real event-to-panda handoff integration coverage, and update superseded old-layout assertions with rationale","owner":"developer"},{"item":"Verify acceptance tests unchanged, real scene handoff behavior and current occupancy projection","owner":"qa"},{"item":"Default-camera visual verdict","owner":"user"}]}
```

## State
Specify complete; implementation and live integration verification pending.

## What changed
Branch `tests/den-scene-v1-01`, commit `2c41ad29c56d8431b847fa964043efaa293d771e` (base `05960f1`). Tests only.
File: `apps/ui/src/scene/horseshoe-layout.test.mjs`.
Command: `timeout 60 node --test --test-reporter=dot apps/ui/src/scene/horseshoe-layout.test.mjs`.
Result: 35 tests; 34 fail, 1 passes, 0 skipped. Missing targets/yaw/route helper and idle grass behavior cause assertion failures; no import/setup failures.
Projection already passes on the old layout and is retained as a regression guard.

## Criterion map
- Targets ±0.3: six named approved-target tests.
- Capped table-facing yaw: every-kiosk capped-yaw test, using approved `stallYaw(station)` seam.
- Screen-space separation: default-camera counter rectangles test; real rendered counter y=platform+0.5, width=stallWidth(3), depth=1, table radius=1.8, Bao box, camera Euler pitch -0.2.
- Idle slots over 60 seconds: 14 role/reduced-motion tests through existing `stepRoamer` interface.
- Safe handoff travel: 12 ordered-pair `handoffPath` tests check continuous segment clearance >=2.1 and rear-order polar traversal. Developer must add meaningful event-to-panda integration coverage; QA must verify actual live movement. An unused passing helper is insufficient.
- User visual verdict: human-verified criterion, pending user check after implementation (ticket Comments).
- Station-label following: approved-centre label test covers What to build scope.

## Decisions made
Rear path order Tea → Steamers → Front of House → Pantry, or reverse; never the front gap. Geometry tests do not require exact waypoints.
Nominal back x=±3 may overlap table projection. Designer verified x=±3.3 within allowed tolerance; developer records any shift in Comments.

## Next step
Developer implements the approved ticket, adds integration coverage and documents updates to obsolete coordinate, old stagger, roaming lifecycle and Tally expectations. New acceptance assertions stay intact.

## Suggested skills
`organism-protocol`, `tdd`, `handoff`.

## Gotchas
Existing `banquet-layout.test.mjs` requires old coordinates, front-inside-back stagger and old Bao clearance; `roam.test.mjs` requires free wandering. Update superseded assertions explicitly with before/after rationale.
Projection covers default 3-slot widths; current board occupancy and widened kiosks still need real-scene/projection validation. Do not weaken acceptance if a wider counter fails.
Environment facts belong in `docs/agents/cloud-sessions.md`; orchestration has installation incident details.

## Tool refusals
No classifier/permission refusal. Failed commands listed below.

## Failed calls
- exec cell-start: npm ENOENT mkdir `/home/agent/.npm/_cacache`, exit 254; existing cache override restored install; fixable environment friction.
- exec cat guessed `market-sightlines.test.mjs`: No such file or directory; used actual layout tests; fixable exploration mistake.
- exec acceptance test runs: exit 1 for intended missing-feature assertions (first run 22 red/1 green; final run 34 red/1 green); expected QA red stage.

## Worktree receipt
`/workspace/dimsumden-qa01`: clean after test commit; no product changes or background processes.
