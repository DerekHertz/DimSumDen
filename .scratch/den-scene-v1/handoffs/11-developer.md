```json
{
  "ticket": "den-scene-v1/11-bigger-cuter-bao",
  "cell": "developer",
  "current_step": "PARTIAL (context passed 80k at the end of the pure-module stage). Constants, bao-pose.mjs and bao-seats.mjs are done and committed as 70b8cf9 on feat/11-bigger-cuter-bao-4 (a WIP commit on base 66a99cb). Den.jsx and Market.jsx wiring is not started. Scene suite before the orchestrator-step fix: 520 pass, 3 fail; after it 2 fail (the Den.jsx/Market.jsx wiring test and the T5 chips spec conflict, below).",
  "artifacts": [
    "apps/ui/src/scene/banquet-layout.mjs (BAO 2.1 at [0,2.1,-3.3]; STALLS steamers/foh +-3.6, tea/pantry +-5.2; DORMANT_PADS (+-3.4,-7.65); RAIL 2.0 wide derived from the orchestrator rest seat; BELL x 0.75; Pass seats from SEAT_LOCAL, steps -0.39 x for the orchestrator and -0.4 z for product and architect, slot 3+ clamps to slot 2)",
    "apps/ui/src/scene/iso-projection.mjs (TARGET z -2.9, comment updated)",
    "apps/ui/src/scene/handoffs.mjs (rear arc radius 6.1), apps/ui/src/scene/roam.mjs (Bao rect from BAO.scale)",
    "apps/ui/src/scene/bao-pose.mjs (BAO_POSE, applyBaoPose, faceFor, softenPatches with PATCH_WINDOW and PATCH_TARGET)",
    "apps/ui/src/scene/bao-seats.mjs (bakeBaoSeats, seatWorld, railWorld)"],
  "decisions": [
    "bao-pose tests 11/11 green, bao-seats tests 5/6 green (the 6th is the Den.jsx wiring test). T2 passes at BAO.position[1] = 2.1 with the pose table on (no correction needed).",
    "Seat anchoring: bakeBaoSeats anchors each product/architect seat to the bone that skins the hit triangle (barycentric weighted skin weights), not to an arm bone found by mean x. The surface under the seat column is a steep cliff at the arm edge, and anchoring to the arm bone only made product#1 float 0.051 at breathe 0.7; anchoring to the hit bone passes every breathe sample. Orchestrator and the rail anchor to the head bone.",
    "Product and architect rest x is -0.81/+0.81 model units (world +-1.701), not the designer's 0.82: at 1.722 the column sits on the arm edge and the surface reads 2.20, 0.088 under the designer's 2.289 (the test allows 0.063). At 1.701 it reads 2.24 and both rest tests pass.",
    "Orchestrator slot step is -0.39 x (not -0.4): the qa layout test needs |x| + 0.22 <= 1.0 for the third panda (0.8 + 0.22 = 1.02 fails), while the seats test allows 0.063 around -0.8. Only x of about -0.78 satisfies both; a step of -0.39 gives -0.78. This is a 0.02 inconsistency in qa's two tests with the spec's -0.8; no test edited.",
    "Seats are baked from the posed mesh through the same triangle-surface rule the tests use. The pure layout (placeCell) gives only the column (x, z) and the rest y.",
    "Slot 3 and up clamp to the last seat in both placeCell and seatWorld, as the spec says (untested)."],
  "failures": [
    "SPEC CONFLICT, needs the orchestrator or designer: bao-placement 'T5: the shoulder pandas status chips do not overlap either pill' fails at 375x667 with the Library pill overlapping the product chip. It passes with pad z -7.2 (verified by a temporary edit, reverted) and fails with the designer's A2 pad z -7.65, which the banquet-layout pad tests pin. qa listed this test as a green regression guard, but it breaks under A2. Levers that no test pins: the pill sprite's y or its offset toward the camera in PadChips (Den.jsx), or the chip anchor. I did not change either; tests untouched.",
    "Product slots 1 and 2 (z -3.784, -4.184) do not land on the arm top: the column at x -1.70 hits the lower flank (y about 1.30 and 1.07 at sit_still), well under the shoulder (2.24). The ray hits Bao, so the tests pass and nothing is clamped; the designer's spec says to report the numbers. The panda stands against his side below the arm and probably intersects the cheek wall next to it. The designer should look at this in review (R2).",
    "The start-here context file alone cost about 20k tokens; reading it plus the three handoffs put me at 60k before any code. Context reading was 133k at the stop."],
  "pending": [
    {"item": "Wire Den.jsx (details in the Gotchas section below), then Market.jsx (ServiceBell reads railWorld through the seat store), then run the full scene tests and npm test through scout, review, finish the handoff and release at in-review.", "owner": "developer"},
    {"item": "Decide the T5 chips conflict (see failures): designer or orchestrator picks the lever; qa verify then checks it.", "owner": "orchestrator"},
    {"item": "Designer checks at review: the 2 px kiosk-edge margin at 375 (Tea and Pantry at x +-5.2), product#1 and #2 seats on the flank, seat x 1.701, the rail and bell.", "owner": "designer"}]
}
```

## State

Source for the pure side is done and committed (70b8cf9, one WIP commit on top of 66a99cb on feat/11-bigger-cuter-bao-4). The three renderer pieces are left: Den.jsx, Market.jsx, and the T5 chips conflict. Scene suite: wiring needles and T5 chips at 375 are the two reds left (the orchestrator-slot rail test went green with the -0.39 step; bao-seats, bao-pose and banquet-layout together: 50 pass, 1 fail, the wiring test). The full-suite number (520 pass) came from before that fix; `npm test` has not been run.

## Gotchas for the next developer (the wiring plan, settled)

- Put a seat store `{ baked: null }` in DenFigures (`useMemo` on gltf) and pass it to Figure (Bao), the Pass Figures, RoamFigure and Market. Reset `baked` to null where Bao's Figure creates its object and on unmount.
- Figure (Den.jsx): for `id === "bao"`: in the object `useMemo`, replace each non-face SkinnedMesh geometry with `softenPatches(n.geometry, n.skeleton.bones.map((b) => b.name))` (dispose it on unmount); in `useFrame`, right after `mixer.update(dt)` call `applyBaoPose(object)` then `root.current.updateMatrixWorld(true)`, and bake once when `s.clip === "sit_still"` and `!seats.baked`: `seats.baked = bakeBaoSeats(object)` (try/catch, log once). Face: use `faceFor(id, cmd.face)` in place of `cmd.face` when looking up the atlas frame.
- Wiring test needles in Den.jsx: `./bao-pose.mjs`, `./bao-seats.mjs`, `applyBaoPose`, `faceFor`, `softenPatches`, `bakeBaoSeats`, `seatWorld`, and `applyBaoPose(` must come after `mixer.update(dt)`. Market.jsx: `./bao-seats.mjs` and `railWorld`.
- Pass figures: orchestrator and extra product and architect cells are plain Figures (position from placeCell at render); add a `seat` prop `{ type, slot, lift: footLift }` and at the end of `useFrame` write `root.current.position.set(p.x, p.y + lift, p.z)` from `seatWorld(seats.baked, type, slot)` when `seats.baked`. The first product and architect are RoamFigures: add `slot` to the objects `placed()` and `idlePlaces` return, and in RoamFigure's `useFrame` pass the live `seatWorld` point as `slot` to `stepRoamer` (it rests at `slot` every frame).
- Same-frame ordering: render Bao's Figure BEFORE `<Market>` and the roamers in the DenFigures fragment (R3F runs useFrame callbacks in subscription order), so the bones are current when Pass figures and the rail read them. Today Market is first; swap them. This cannot be tested in node; the designer's R1 covers it.
- Market.jsx ServiceBell: refs on the rail mesh and the bell group; in `useFrame`, when `seats.baked`, set the rail to `railWorld(baked)` and the bell to `BELL + (railWorld - RAIL)` (delta). Keep the static RAIL and BELL as the first-render values. Nothing may throw when `baked` is null (glb failed or still loading).
- Reduced motion needs nothing extra: the director holds sit_still and content_squint, the pose table is a static override.
- Worktree guard: no heredocs or chains; use the Write tool for scripts (a /tmp path shared with other cells may already exist, so pick a unique name).
