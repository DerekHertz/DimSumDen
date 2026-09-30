# 01: Horseshoe layout, pandas stay at their station

**Type:** feature

**Priority:** P1

**Blocked by:** None

**Status:** resolved

**Design refs:** `docs/design/den-map.md` (coordinates, constants, checks) and `docs/design/2026-09-29-scene-decisions.md` (the why), on branch `design/scene-decisions-0929` until it merges. Target frame: "Level 1 · Den (target)" on the Zoom levels page of the zoom frames canvas (https://claude.ai/artifact/JsxZ5Vj7DxJQbekA2Ehoot). Design system: https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j (Scene, Glossary, Panda roles).

## What to build

Move the four kiosks, the cubs basket and the Tally into the horseshoe, turn each kiosk toward the table, and stop free roaming. After this, no kiosk hides another from the default camera, and a panda leaves its station only to carry a handoff.

## Numbers (world units; the table is the origin, +z toward the camera)

| Thing | Now (x, z) | Target (x, z) | Yaw (rad) | Constant |
|---|---|---|---|---|
| Steamers | -4.8, -1.6 | -3.0, -1.4 | +0.52 | `STALLS.steamers` (keep 0.5 platform) |
| Front of House | 4.8, -1.6 | 3.0, -1.4 | -0.52 | `STALLS["front-of-house"]` (keep platform) |
| Tea | -4.0, 2.2 | -4.9, 2.0 | +0.52 | `STALLS.tea` |
| Pantry | 4.0, 2.2 | 4.9, 2.0 | -0.52 | `STALLS.pantry` |
| Cubs basket | 0, 3.4 | -1.8, 3.0 | 0 | `CUB_BASKET` |
| Tally | 1.5, 3.4 | 1.8, 3.0 | keep the face-the-camera formula | `TALLY` |

- Kiosk yaw is `clamp(atan2(-x, -z), -0.52, 0.52)`. Export it as a function so 03 and the tests use the same rule.
- Positions may move up to ±0.3 if an acceptance check needs it. Say so in Comments if you move one.
- Bao, the table, the camera and the `PASS` perches don't change.
- Remove free roaming from `roam.mjs`. Idle pandas stay in their station slot. Handoff travel (`handoffs.mjs`) is the only movement between stations and walks the arc between kiosks, not across the open grass.
- Station labels follow their kiosks (`station-labels.mjs` reads the new centres).

**Files:** `apps/ui/src/scene/banquet-layout.mjs`, `roam.mjs`, `station-labels.mjs`, their tests; `Market.jsx` only to apply yaw.

## Acceptance criteria

- [ ] Each kiosk, the cubs basket and the Tally are at their target (x, z) within ±0.3 (test on layout exports)
- [ ] Each kiosk's yaw equals the clamp rule; |yaw| ≤ 0.52
- [ ] From the default camera, no kiosk's counter-top rectangle overlaps another kiosk's, Bao's or the table's screen-space bounds (projection test)
- [ ] An idle panda's position stays within its station slot over 60 simulated seconds (roam test)
- [ ] A handoff path from any station to another never passes within 0.3 of the table edge or crosses the open grass in front of it
- [ ] User visual verdict at the default camera

## Comments

- **Created (designer, 2026-09-30):** Filed from the 09-29/30 design session; the user approved every decision in this ticket.
- **qa, 2026-09-30:** QA specify: default-camera visual verdict is human-verified (pending user check after implementation). Layout exports, capped stallYaw(station), projection and stepRoamer are acceptance seams. handoffs.mjs routing is authorized by What to build; omission from Files is clerical. Existing old-layout assertions require explicit documented updates; new acceptance assertions remain intact.
- **qa, 2026-09-30:** Designer clarification (orchestrator): handoffs follow rear order Tea → Steamers → Front of House → Pantry or reverse, never the front gap, with >=2.1 continuous clearance from rendered table centre. QA route helper tests require live event-to-panda integration coverage during developer/verify; helper alone is insufficient. Projection uses rendered counter y=platform+0.5. Back x=±3.3 is permitted within tolerance if needed; any shift must be commented. Widened-counter occupancy needs validation.
- **qa, 2026-09-30:** QA specify handoff: .scratch/den-scene-v1/handoffs/01-qa-specify.md; tests/den-scene-v1-01 @2c41ad2; 35 tests, 34 expected red, projection green. Live handoff integration and widened occupancy validation remain explicit developer/QA obligations.
- **developer, 2026-09-30:** Rear kiosks moved to x=±3.3, z=-1.4 (approved ±0.3 target tolerance) for default-camera counter/table projection clearance. Applying capped yaw to both counters and their panda slots; front targets and Bao/PASS/camera stay as approved.
- **developer, 2026-09-30:** Foundation batch: 01-horseshoe-layout + 02-station-hues both touch Market.jsx; implementations run sequentially, final QA/design/risk review and PR cover both. User default-camera visual verdict remains pending. Superseded test map: old centre literals now match approved coordinates; slot literals follow capped yaw; front-inside-back stagger reverses to horseshoe; old 1.0 shoulder-gap rule is replaced by unchanged screen-space acceptance; grass wander/home/entry-exit/fade assertions replaced by fixed-slot lifecycle plus event delivery/return integration. Tally/Cubs labels follow approved moved props.
- **developer, 2026-09-30:** Self-review correction: counter widths and projected station labels count persistent idle roles as well as active cells; this keeps idle Scout inside a widened Steamers kiosk instead of allocating a seventh-slot panda against six-slot geometry. Camera/bearing test literals also follow relocated landmark exports; camera pose/Euler remains unchanged. Foundation02 resumes next session per user context cutoff.
- **developer, 2026-09-30:** Current rendered occupancy projection passes with Steamers width5.25 (six active developers plus idle Scout), all other kiosks2.25; no counter overlaps Bao/table/other counters. Desktop light/dark screenshots and JSON evidence: /tmp/den-scene-v1-01/. Tea/Pantry are partly off-canvas at actual scene aspect1.289; approved centres/camera retained for user visual verdict. Real demo source QA movement observed; live receiving/return endpoint probe timed out (30s), while unchanged acceptance and derived-event simulations cover all kiosk endpoints/returns. Cause not proven: probe supplied timeout options as argument; renderer caps dt0.1 and frame timings were not recorded. Offline same QA event delivers after221 frames/7.367 simulated seconds.
- **developer, 2026-09-30:** Final checks: 1312/1312 full tests pass after occupancy correction; all35 QA acceptance assertions unchanged; production build and desktop capture pass with zero console/page errors. Standards self-review: no hard violations (small duplicated occupancy-count loop in Den/ChipLayer is a judgment note); spec self-review: automated geometry/idle/event movement implemented, default-camera user verdict and live return observation pending. Pan reachability extent counts12 active plus idleScout (13 maximum Steamers perches); old active-only cap equality superseded. Default camera pose/Euler unchanged.
- **developer, 2026-09-30:** Developer handoff: .scratch/den-scene-v1/handoffs/01-developer.md; feat/den-scene-v1-01 @444f674, final1312/1312 tests pass, unchanged35 QA acceptance cases. Current widened occupancy projection and desktop screenshots published as evidence. In-review: QA/live-return verification and user visual verdict remain;02 resumes next session.
- **developer, 2026-09-30:** Scope added (user approval, 2026-09-30): adopt the wider framing proposal for ticket01. Approved default camera x0/y4.2/z13.8, Euler pitch-0.2, FOVabout46°, so all four complete kiosks fit at desktop1600x900 (scene aspect1.289). This explicitly supersedes the camera-unchanged constraint for default framing only; retain35 QA acceptance assertions and add complete-kiosk visibility plus counter/Bao/table separation regression at the proposed default. No other UI/asset scope added.
- **developer, 2026-09-30:** Approved-framing implementation complete: default zoom1 now means baseZ13.8; FOV46 shared by App Canvas and camera-rig, x0/y4.2/Euler-0.2 preserved. Existing camera controller literals updated for user-approved distance/FOV; all35 QA acceptance assertions unchanged. New complete-kiosk/default-camera/separation regression passes, focused51/51 and full1315/1315 pass; build passes. Actual built1600x900 capture confirms all four full kiosk bounds inside frame (furthest|x|0.9346), current Steamers width5.25, no counter/Bao/table overlaps, zero console/page errors. Updated light/dark and built-framing.json are in /tmp/den-scene-v1-01/. Live endpoint timeout was not revisited.
- **developer, 2026-09-30:** Updated developer handoff: .scratch/den-scene-v1/handoffs/01-developer.md; final feat/den-scene-v1-01 @0455316 includes user-approved wider framing atop444f674. Full1315/1315 pass,51 focused framing/controller/projection pass,35 original acceptance assertions unchanged. Built screenshot/geometry evidence confirms approved framing with all four full kiosks visible. In-review pending full QA and final visual judgment; no new ticket or Blender work.
- **developer, 2026-09-30:** Corrected latest handoff pointer: .scratch/den-scene-v1/handoffs/01-developer-framing.md @0455316. Board preserves earlier-claim01-developer.md and refused overwrite; fix-round handoff published under new supported filename. Final1315/1315 tests,51 focused checks and approved whole-kiosk framing evidence are in this latest handoff.
- **qa, 2026-09-30:** QA bounce: banquet-layout.mjs:20 Tally bearing still uses original-camera relative z8.5; approved framing requires z10.8 (-0.1651486774), and tally-stele.test.mjs:28 expects obsolete angle. Full1315/1315 pass, unchanged35 acceptance tests, independent real renderer delivery/return and full-kiosk geometry pass. Optional screenshot timeout remains explicitly separate. Handoff: handoffs/01-qa-verify.md.
- **developer, 2026-09-30:** QA narrow bounce fixed: Tally now derives its face-camera yaw from shared default BASE_Z13.8 and Tally position, -atan2(1.8,10.8)=-0.16514867741462683 rad. Camera constants moved into dependency-free leaf shared by layout/controller to avoid circular imports; existing controller exports preserved. New regression relates Tally bearing to actual cameraPosition(0,1). All81 affected tests and full1316/1316 pass; build passes; original35 acceptance assertions unchanged. No new browser capture or unrelated work.
- **developer, 2026-09-30:** Latest developer fix handoff: .scratch/den-scene-v1/handoffs/01-developer-tally-bearing.md @401c674. Narrow Tally bearing correction passes81 affected tests, full1316/1316 and build; original35 acceptance cases unchanged. Ready for QA recheck and authorized01 merge relay.
- **qa, 2026-09-30:** QA pass at401c674: Tally now faces shared approved camera exactly; independent62 affected/acceptance/framing tests pass,35 original assertions unchanged. Developer full1316/1316/build pass; prior actualbrowser movement/geometry evidence retained. Handoff: handoffs/01-qa-final.md. Final human visual criterion remains designer/user relay.
- **designer, 2026-09-30:** Design pass: approved desktop light/dark framing shows all four complete kiosks and visible counters/signs, centered Bao/table, front Cubs/Tally. QA validates final Tally bearing and renderer movement. Handoff 01-designer-final.md at 401c674.
- **orchestrator, 2026-09-30:** Merged PR101 on green test/security CI. Final session handoff: handoffs/01-orchestrator-session.md; ticket02 and usage-watch81 deferred.
