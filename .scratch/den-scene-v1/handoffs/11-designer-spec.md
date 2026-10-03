```json
{"ticket": "den-scene-v1/11-bigger-cuter-bao", "cell": "designer", "mode": "spec",
 "current_step": "UI spec for option B (Soft bun) is complete: scale and placement, camera headroom, Bao pose table, face frame, patch softening, bone-anchored Pass seats, states, a11y, design-system wording, and a numbered test list for qa specify",
 "artifacts": [
  ".scratch/den-scene-v1/handoffs/11-designer-spec.md",
  ".scratch/den-scene-v1/handoffs/11-designer-direction.md",
  ".scratch/den-scene-v1/refs/direction-11/B-den.png, B-close.png, B-mobile.png, harness/c5.json (the picked config)",
  "https://claude.ai/artifact/MyJvqgyB5A4h4qq7DUUUYc (the direction page)"],
 "decisions": [
  "Option B at Bao scale 2.1, position [0, 2.1, -3.3], back kiosks to x +-3.6, as rendered in B-den.png",
  "The default camera TARGET moves from z -2.4 to z -2.9. At 2.1 the orchestrator's hat is 28 px from the top edge at 1440x900 and 21 px at 1280x720, so its status chip would clip; -2.9 gives 53 px and 41 px. This is a ripple outside the direction render (iso-projection and camera tests pin -2.4) and is flagged for the orchestrator",
  "Dormant pads (Library, Drum) move from x +-2.9 to +-3.4: at 2.9 their pills sit 2 px (1440x900) from the shoulder pandas and touch at 375",
  "Handoff rear arc radius goes from 4.4 to at least 6.1 (it now cuts through Bao: his back is at z -5.14 and the padded obstacle reaches -5.54, corner distance 6.08)",
  "Pass seats are bone-anchored: baked once from the posed, overridden mesh as (bone, offset in bone space), then moved every frame with the bone. Orchestrator on the head bone, product and architect on the arm bones. The rail and bell ride the orchestrator's delta",
  "Extra Pass cells: orchestrator slots 1 and 2 step -0.4 world x along the rail (away from the bell); shoulder slots 1 and 2 step -0.4 world z along the arm top; slot 3 and up is an open question (clamp to the last seat, untested)",
  "No new tokens, no new UI copy. Design-system wording changes are listed below and are made after the build ships, with the user's approval",
  "Deferred as told: eye-patch overlays and a three.js-only panda"],
 "failures": [
  "Bash 'git worktree list | head -1; echo ...' refused by the worktree guard as too complex; reran as a plain 'git worktree list'",
  "Bash with a leading cd plus a heredoc-style node script refused by the same guard; wrote the script with Write and ran 'node <path>'",
  "Grep tool is not available in this session; used 'grep' through Bash"],
 "pending": [
  {"item": "qa specify: write failing tests T1-T14 below, mapped to the ticket's checkboxes and the scope here", "owner": "qa"},
  {"item": "developer build against the spec and tests; flag any lever used (kiosk x 3.7, patch window) with its measured number", "owner": "developer"},
  {"item": "designer review after qa verify (checklist at the end), then the design-system upkeep edits listed under Design system wording", "owner": "designer"}]}
```

## State

Spec done for option B. Ticket released at its current status after this handoff. No repo files changed; the worktree is clean. Everything measured here came from the repo at 642b2f3 and the direction harness numbers (`refs/direction-11/harness/c5.json`); the seat numbers are the direction's, not re-measured from a new build, so qa's test measures the posed mesh and uses them only as a cross-check.

## What was read

The ticket, the direction handoff, the design system README and tokens (artifact HBXgYhAzu6YmekpW71WM7j, synced from main@7706961), `banquet-layout.mjs`, `grove-layout.mjs`, `grove.mjs`, `roam.mjs`, `handoffs.mjs`, `iso-projection.mjs`, `chip-model.mjs`, `Den.jsx` (Figure, DenFigures, PadChips), `Market.jsx` (rail and bell), the character director (face per state) and `panda-contract.mjs`. The zoom-frames artifact was not read; it needs the upkeep listed below.

## 1. The picked build (B, Soft bun), in numbers

| | Today | Build |
|---|---|---|
| `BAO.scale` | 1.4 | 2.1 (1.5x; 7x a 0.3-scale cook, the design system says about 10x today) |
| `BAO.position` | [0, 1.4, -2.4] | [0, 2.1, -3.3]. Feet stay on the ground: see T2 |
| Bao footprint box (x half, z half) | 1.4 x 1.23 | 2.1 x 1.8375 (z -5.1375 to -1.4625) |
| Back kiosks (`STALLS` steamers, front-of-house x) | -3.0, +3.0 | -3.6, +3.6 (z stays -1.4) |
| Dormant pads (`DORMANT_PADS` x) | -2.9, +2.9 | -3.4, +3.4 (z stays -7.2) |
| Camera `TARGET` (`iso-projection.mjs`) | [0, 0, -2.4] | [0, 0, -2.9]; its comment becomes "the den's centre" (it is no longer Bao's feet) |
| `STONE_RING.center` | follows `BAO.position` | unchanged rule, so it moves to z -3.3 |
| Grove (`LAYERS`, `mound`) | | unchanged. The user picked B with the grove as rendered. The mound front (z -4.4) now sits inside Bao's back plane, hidden behind his flanks; T8 pins that no stalk touches him |
| Table, Tally, Cub basket, front kiosks | | unchanged |

Pose table, applied to Bao only, every frame, after `mixer.update(dt)` and before anything reads bone matrices. Values are absolute, not multiples, because every clip writes scale on every bone:

| Bone | Scale (x, y, z) |
|---|---|
| `root` (body squat) | 1, 0.96, 1 |
| `head` | 1.2, 1.18, 1.18 (carries the face decal and the ears with it) |
| `ear_L`, `ear_R` | 1.05, 1.05, 1.05 (on top of the head scale) |
| `arm_L`, `arm_R` | 1.1, 1.1, 1.1 |

Measured on the posed mesh in the direction (B): head width over body width 0.82 (today 0.68). The build must read 0.78 to 0.86 (T10). Keep the table in one pure module (for example `bao-pose.mjs`: the table, the face rule, the patch window) so the test and the renderer share it.

**Face.** Bao's resting frame is `content_squint` where the director says `half_lidded` (the idle frame). Every other frame the director returns, including `blink` and all state frames, passes through untouched. Under reduced motion the director returns no blinks, so Bao holds `content_squint` still. Cooks and the Pass pandas stay `half_lidded`. The face decal must stay on the head surface at the new head scale (review item R4).

**Patches.** Soften Bao's eye patches by editing `COLOR_0` on a clone of his geometry, never the shared glb geometry (every other panda uses it). Window, in bind-pose mesh coordinates: vertices whose dominant bone is `head`, local z >= 0.1, 0.15 <= y <= 0.55, |x| <= 0.5, and whose mean colour is <= 0.25. Move each channel halfway (k 0.5) toward 0.06. The result stays neutral (r = g = b ratios unchanged, so it is never tinted) and reads at least 7:1 against `panda-fur` (a patch near #313131 against #fbf8ef is about 12:1). The nose stays as black as before (R4). Eye-patch overlays and reshaping the ragged edges are deferred.

## 2. Placement and the default frame

All at the default zoom, desktop 1440x900 and mobile 375x667. Screen numbers use `worldToScreen` with `defaultFrame`.

1. **Nothing overlaps Bao.** The existing default-framing tests (Bao box against counters, signs, table, hamper, Tally, kiosks, and inside the viewport) pass with the new constants. Add: the back-kiosk platform footprint clears Bao's footprint box by at least 0.05 world. At x +-3.6 the gap is 0.07 (computed with the real yaw cap 0.52 and platform half sizes 1.275 x 0.65). If the posed arm (scale 1.1) reaches wider than the box and a render shows contact, move the back kiosks to x +-3.7 (gap 0.17) and report the number; do not go further without asking.
2. **Pass chips and pills.** Shoulder pandas and the Library and Drum pills must not touch. The pill is a 3D sprite 1.714 world wide (0.3 tall) centred on the pad. With pads at +-3.4 the gap from each pill to the nearer shoulder panda is about 46 px at 1440x900 and 15 px at 375 (at x 2.9 it was 2 px and about 0). Require at least 8 px at both sizes. Also require the shoulder pandas' status chips (96 x 22, de-overlapped by `stackChips`) not to overlap either pill.
3. **Headroom.** The orchestrator's hat top plus its status chip (24 px with the gap) stays at least 8 px inside the top edge. With `TARGET` z -2.9 the hat top is 53 px at 1440x900, 41 px at 1280x720 and 45 px at 1366x768; the chip tops are 29, 17 and 21 px. With -2.4 the hat is at 28, 21 and 23 px and the chip would clip. The lever is `TARGET` z only, never x or the 0.52 anchor. After the change the existing fit tests (kiosks, Tally, hamper, cubs row, 375px width from den-scene-v1/10) must still pass; the cubs row bottom stays under the viewport bottom with at least 26 px at 1280x720. The iso-projection and camera tests that pin -2.4 (literals in `iso-projection.test.mjs`, `camera-*.test.mjs`) update to -2.9 and their screen literals are recomputed, not edited by eye.
4. **Roamers.** `roamObstacles` takes Bao's rect from the scale: half sizes `BAO.scale * 1.0` and `BAO.scale * 0.875`, centre `BAO.position`. The handoff rear arc in `handoffs.mjs` cannot stay at radius 4.4 (it would cut through Bao). Use a radius of at least 6.1, so that every arc sample falls outside the padded Bao rect (`roamObstacles`, pad 0.4). Known cost: an arc at 6.1 crosses the near bamboo band (z -5.2 to -4.0, |x| >= 2.8). Review looks for a walking panda clipping a stalk; if it does, move that band's z range back by 0.9 rather than changing the arc.
5. `handoffs.mjs` `stationBearing` for Bao and every use of `BAO.position[2]` follow the constants; no literal -2.4 may remain in layout code (the ring tests' literal -2.4 become -3.3).

## 3. Pass seats: bone-anchored, touching Bao

World numbers at rest (s = 2.1; local model units in brackets, feet at y -1):

| Seat | Bone | World (x, y, z) | Model (x, y, z) |
|---|---|---|---|
| Orchestrator (top of the rail) | `head` | (0, 4.2714, -3.6885) | (0, 1.034, -0.185) |
| Product, Bao's left on screen | arm bone with x < 0 | (-1.722, 2.289, -3.384) | (-0.82, 0.09, -0.04) |
| Architect | arm bone with x > 0 | (1.722, 2.289, -3.384) | (0.82, 0.09, -0.04) |
| Rail | `head` | centre y 4.2465, z -3.6885, width 2.0 | |
| Bell | `head` | x 0.75 on the rail top | |

Pick each arm bone by the sign of its vertices' mean x at `sit_still`, not by the L or R in its name (the panda's sockets are mirrored: socket x is world -x).

Rules:

1. **Rest seat.** The pure layout (`placeCell` for `orchestrator`, `product`, `architect`) returns the rest seat above, derived from Bao's local seat constants times `BAO.scale` plus `BAO.position`, replacing the `PASS` fractions of Bao's box (the fractions put the shoulder pandas at x 1.1, y 0.44 against a shoulder at x 0.8, y 0.16, which is why they float today). Keep `PASS_STEP` 0.4 as the slot step.
2. **Bone anchoring.** Bake each seat once from the posed, overridden mesh: the top surface under the seat column (a downward ray, or the highest posed vertex in the column), stored as (bone, offset in that bone's space). Each frame, after Bao's pose override, transform it with the bone's world matrix and write it to a shared seat store. Pass pandas and the rail, bell and order slips read the store in the same frame, so Bao's Figure must update before them (mount order or `useFrame` priority; no one-frame lag).
3. **Touch.** A Pass panda's lowest point is within 0.02 world of Bao's surface at its seat, with "lowest point" meaning the lowest vertex of the panda's own skinned mesh (not its headgear or prop) and "surface" the posed Bao mesh at the panda's centre column. For the orchestrator the chain is: panda base on the rail top within 0.02, rail underside on the crown (the head surface at x = 0) within 0.02. The rail is a fitting on Bao's crown, 0.05 thick; this reading of the ticket's "Bao's surface" is flagged for the orchestrator. The rail's ends bridge over the head toward the ears and need not touch.
4. **Through motion.** The rule in 3 holds at `sit_still` (Bao's actual idle clip, static), and at the extremes of `breathe` (Bao's head lifts about 0.025 model units, 0.05 world, so a fixed seat would float by more than 0.02). Sample each clip at 0, 1/4, 1/2 and 3/4 of its duration and take the worst. Under reduced motion the held pose is `sit_still`, so seats are static.
5. **Extra cells.** Slots follow `parsePerch` (`orchestrator#1`, `product#2`, and so on).
   - Orchestrator slots 1 and 2: `PASS.orchestrator.step` becomes -1, so they sit at x -0.4 and -0.8 on the rail (away from the bell), both on the rail top. Three pandas, each 0.44 across, just fit the 2.0 rail.
   - Product and architect slots 1 and 2: step -0.4 world z per slot, along the arm top, with y from the same downward ray at that column (today they step outward into the air, 0.4 beyond the arm). The ray must hit Bao; if it misses at 0.4 or 0.8, the developer reports the numbers and the designer re-specs, and does not clamp silently.
   - Slot 3 and up: not specified. The developer clamps to the last seat so nothing floats; qa does not test it. Open question for the user if it ever shows.
6. **Lean.** No roll by default. If a shoulder panda's body penetrates the cheek by more than 0.04 world (R2), first nudge the seat 0.05 outward, and if that is not enough roll the panda away from the head by up to 6 degrees; the 0.02 rule still decides the final seat. "Tilt toward the head" from the direction is dropped: leaning in puts the inner foot into the slope.
7. Product and architect stay put during handoffs (their station is not in `STALL_CENTERS`, so no route is built). Do not change that.

## 4. States

| State | What Bao and the seats do |
|---|---|
| Default, light or dark | The scene is the same in both themes: Bao's fur, the grove and the rail are not themed. Pads and headgear rebuild on a theme swap as today |
| Empty (no active cells) | All three seats are still occupied: the orchestrator stand-in on the crown, product and architect idle at the shoulders (one panda per roamer type remains). Nothing else sits on Bao |
| Loading | Until `panda.glb` arrives, no figures, so no seats; the backdrop, rail-less den and pads show |
| Error (glb fails) | The existing figures boundary drops every figure and logs once; no seat code may throw when Bao is absent (the seat store is empty and the rail hides with it) |
| Reduced motion | `sit_still` held, no blink, `content_squint` held, pose table and seats static, no new motion anywhere |
| Idle motion | `sit_still` (static). `breathe` is the extreme case for the tests; seats and rail follow it |
| Needs you | Unchanged: the bell glows `lantern-fill`, Bao does not turn (not built) |
| 375px | Same layout; shoulder pandas about 17 px wide, chips and pills per section 2 |

## 5. Interactions, copy, accessibility

- Bao is not interactive and has no label (`stage` null, no chip): clicking him selects nothing. Pass pandas keep their click and keyboard behaviour through their status chips; the hit area of a seated panda must not be blocked by Bao's mesh (R5).
- No new UI copy. Existing strings stay: pill text "Library · coming online" and "Drum · coming online", chip labels, and each panda's `aria-label` "id, role, station, state" through its chip.
- Text and non-text contrast are unchanged apart from the patches (7:1 or better against fur, section 1). Chips keep the 2px `focus-ring`. The chips are 22 px tall, under the 24 px target size of WCAG 2.2; WCAG 2.1 AA, which the review runs, does not set a minimum, and this is unchanged by the build.
- Reduced motion: nothing new moves; the pose override must not add motion.
- Tokens used, all existing: `panda-ink`, `panda-fur` (fur, never tinted), `station-pass` (Pass scarves), `rice-paper` and `surface-200` (pills and chips), `focus-ring`, `dur-heartbeat` (blink spacing), `dur-breath`. No token is added or changed.

## 6. Design system wording (after ship, with the user's approval)

1. 3D look: "Bao is that panda at about 10x the size of a panda cook" becomes "about 7x".
2. 3D look: after "sleepy half-lidded eyes, a small smile": "Bao rests on a softer face, a squint with a smile (`content_squint`); he still blinks like every panda."
3. Color: after "Panda fur uses panda-ink and panda-fur in both themes and is never tinted": "Bao's eye patches are one step softer charcoal than a cook's; the change is lightness only, never a tint."
4. Mascot and pandas, and the Pass row: "Pass pandas sit on Bao: the orchestrator on the pass rail across his crown, product and architect on his outer shoulders. They move with him and never float."
5. The zoom-frames artifact (Levels 1-4) still shows Bao at 1.4 and floating Pass pandas; refresh Level 1 and Level 3 after the build.

## 7. Tests for qa specify (T1 to T14)

Ticket checkboxes: scale and no overlap (T1 to T7, T11 to T13), seats (T9), user verdict (review). Each criterion needs a test:

| | Test |
|---|---|
| T1 | `BAO.scale` 2.1 and `BAO.position` [0, 2.1, z -3.3] (x and z literals; y by T2) |
| T2 | Posed Bao (pose table applied, `sit_still`): lowest mesh y in world within 0.02 of 0. If the squat lifts the feet, the developer sets `position[1]` to fix it and reports the correction; the test reads the mesh, not the formula |
| T3 | Back kiosk x +-3.6; platform footprint clear of Bao's box by at least 0.05 |
| T4 | Default-framing: Bao box vs counters, signs, table, hamper, Tally, kiosks, and inside the viewport, at 1440x900 and 375x667 (existing tests, updated constants) |
| T5 | Pill vs shoulder panda rect at least 8 px, and pill vs shoulder chips, at 1440x900 and 375x667 (pads x +-3.4) |
| T6 | Headroom: orchestrator hat top and chip top at least 8 px inside the top edge at 1440x900, 1280x720, 1366x768; fit tests pass; `TARGET` is [0, 0, -2.9] |
| T7 | `roamObstacles` Bao rect from the scale; all handoff arc samples (every back and front kiosk pair) are outside the padded Bao rect; no literal -2.4 in layout |
| T8 | `groveLayout()` unchanged for the same seed; no stalk within 0.3 of Bao's footprint box |
| T9 | Seats: for orchestrator slots 0 to 2, product slots 0 to 2, architect slots 0 to 2, the panda's lowest point is within 0.02 of the posed Bao surface in its column (rail chain for the orchestrator), at `sit_still` and at four samples of `breathe`, and Bao's seat store drives the Pass figures and the rail in the same frame. Rest seats match the table above within 0.03 model units |
| T10 | Pose table values; head width over body width of the posed mesh between 0.78 and 0.86; the table applies to Bao only (a cook's posed vertices are unchanged) |
| T11 | Face rule: Bao idle returns `content_squint`; `blink` passes through; other states unchanged; a cook still returns `half_lidded` |
| T12 | Patch softening: only Bao's cloned geometry changes; the shared glb `COLOR_0` is untouched; softened vertices are neutral and at least 7:1 against `panda-fur`; the nose vertices are unchanged |
| T13 | Reduced motion: with the director in reduced mode, Bao's face is `content_squint`, no blink, pose table applied, seats equal the rest seats |
| T14 | Stone ring centre equals `BAO.position` x and z; the footprint rule still drops stones that touch kiosks, table, hamper or Tally |

## 8. Review checklist (designer, after qa verify)

Desktop 1440x900 and 375x667, light and dark, reduced motion, at most 40 tool calls.
- R1. Seats at rest and over a `breathe` cycle: no panda floats or sinks; the rail rests on the crown.
- R2. Shoulder pandas: gap under the far foot at most 0.05 world, cheek penetration at most 0.04 (the lever in rule 6 above).
- R3. Pills, chips, hat headroom and kiosks, with the numbers in section 2.
- R4. The face decal sits on the head (no float or clip at head scale 1.2 x 1.18); the nose is still black; patches softer but still the darkest part of Bao.
- R5. Clicking a Pass panda at both sizes selects it; clicking Bao does nothing.
- R6. Handoff arcs: no walker through Bao, and none visibly through a bamboo stalk.
- R7. Bao against the ground in both themes; the zoom to Level 3 on a Pass panda keeps the seat in view.
- Run `/design:accessibility-review` for WCAG 2.1 AA.

## 9. Build notes for the developer

- Face override: the offset is set per frame from `cmd.face` in `Figure`; map for `id === "bao"` only.
- `Figure` clones the glb scene per instance, but geometry and its `COLOR_0` are shared; clone the geometry and attributes for Bao before editing colours.
- Pose override placement: right after `mixer.update(dt)` and before the face and the anchor code; then `updateMatrixWorld` before reading bone matrices.
- The seat store can be a mutable ref like `stage.anchors`; `RoamFigure` positions for product and architect and the `ServiceBell` group (rail, bell) read it. `DenFigures` computes `at` through `placeCell` at render time, so the per-frame delta must be applied to the group each frame (a `useFrame` or a ref write), not through React state.
- Files likely to change: `banquet-layout.mjs`, `Den.jsx`, `Market.jsx`, `roam.mjs`, `handoffs.mjs`, `iso-projection.mjs`, `market-extent.fixture.mjs`, `default-framing.test.mjs`, `banquet-layout.test.mjs`, `roam.test.mjs`, `horseshoe-layout.test.mjs` (kiosk literals at +-3), `iso-projection.test.mjs`, `handoffs.test.mjs` (`atan2(3.0, -1.4)`).

## Suggested skills

`organism-protocol`, `tdd`, `asset-critique` (not needed unless the review round asks for a posed-mesh critique).

## Gotchas

- Measure seats and the surface from the posed skinned mesh (three's `getVertexPosition` with bones updated), never from the bind pose or glb node numbers.
- The direction's seat numbers assume the exact pose table above; change one value and re-measure.
- `stationOf` returns the cell type for Pass types, which is why they never roam.
