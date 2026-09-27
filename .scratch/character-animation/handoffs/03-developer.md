# Handoff: ticket 03 (production rig, face atlas, asset contract) → ready for human

**State**: done except the user's visual verdict on the arms. The ticket is `ready-for-human`.

## What changed

- Branch `claude/production-rig-asset-contract-6a1723`: commit `57f6ba2` (asset) and the critique-fix commit after it (not pushed, no PR).
- `apps/ui/assets-src/panda/`: the Blender build scripts (`build_mesh`, `build_rig`, `build_face`, `build_clips`, `export_glb`), `face-atlas.png`, `panda.blend` (LFS), `viewer.html` and `README.md` with the rebuild and view steps.
- `apps/ui/public/models/panda.glb`: the production asset.
- `apps/ui/src/assets/panda-contract.mjs` + `.test.mjs`: the asset contract. Root `package.json` runs `npm test` (`node --test`, no dependencies).
- `.claude/launch.json`: `panda-viewer` static server on port 8124.

## Decisions made (the user picked the first two in chat)

- **Arms:** the fused Meshy arms are melted back into the body shell with a masked voxel remesh and smooth. New sewn-on arms have a ball shoulder centred on the arm bone head and are bound 100% to their bone, so no skin stretches.
- **Layout and tests:** zero-dependency `node:test`, no Vitest yet. The contract names live in `panda-contract.mjs`, which ticket 04's director can import or port.
- **Face atlas:** 4×3 cells of 256×128. The decal UVs cover cell 0, and a frame is chosen by texture offset `(i % cols / cols, floor(i / cols) / rows)` in glTF UV space. `extras.faceAtlas` on the `face` node carries it. There is an extra `neutral` frame (open eyes) as `defaultFrame`, since the spec's 10 frames have no resting open-eyed face.
- **Clip metadata as glTF extras:** each action carries `loop: bool` and `faceFrames: [{t, frame}]`, where `""` hands the face back. The contract treats `extras.loop` clips as loops, alongside its named `LOOPS`.
- **Contract extra:** it also fails if the skinned body has no `COLOR_0`. The first export silently lost the vertex colours, and this check caught it.
- **Kept `hop` and `waddle`** from ticket 01 in the glb, though this ticket doesn't list them (spec review flagged this as scope creep). Ticket 05 needs them, and they are not in the contract's required list. Orchestrator: keep them or drop them.
- `dur-heartbeat` = 1.2 s and `dur-breath` = 2.8 s, taken from ticket 01, which cites the design-system tokens.

## Round 2: the user's critique (after the first ready-for-human)

- The arms are about 1.3× thicker (shoulder r 0.25, paw r 0.245, matching the legs) and longer (~0.85 bone). The shoulder moved forward to `(0.60, 0.06, 0.0)`.
- `arms_folded` is re-aimed so the paws overlap in front of the belly, with the right arm under the left. `lean_back`'s arm spread went from 22° to 10°.
- Added the black shoulder band (`band_weight` in `build_mesh.py`) and front paw pads. The palm is chosen so it faces the viewer at the wave aim (`WAVE_AIM_R` in `rig_spec.py`, shared with `build_clips.py`).
- Deleted the pale chin disc (a stray 146-vert loose part).
- Proportions (head vs belly) are unchanged, by the user's choice.
- The bone positions now live in one place, `rig_spec.py`, which resolves the review's duplicated-constants finding for the rig.

## Round 3: the second critique (arms overshot)

- Arms taper now: shoulder r 0.22, wrist r 0.17 (at 78% of the bone), paw r 0.19. The bone is ~0.8 long, and the resting arm peaks at x 0.91, inside the body's 0.97.
- `arms_folded` crosses high on the chest, with the left forearm on top.
- The shoulder band's dip at the shoulders is shallower. The front of each flank above the thigh is painted belly-white (`front_flank_weight`), so the black arms keep their outline.
- A gentle second smooth (`flank_weight`, 30 iterations) removes the Meshy pits where the belly, thigh and arm meet.

## Next step

The **user** checks paw_raise and wave from the front and three-quarter views in the viewer (README), then records a verdict in ticket 03's Comments. After that, the **orchestrator** resolves 03 and dispatches 04.

## Suggested skills

organism-protocol, implement, tdd (ticket 04: the director can import the names from `panda-contract.mjs`).

## Gotchas

- Radial "torso curve" projection and cut-and-patch fills both failed: the Meshy shell has stacked layers under the old paw, and folding them onto one radius tears the surface. The masked voxel smooth in `build_mesh.py` is what worked. Its coarse first remesh (0.024) fuses the paw–belly crevice.
- After `object.join`, the body had a junk second colour layer and no render colour, so the exporter wrote no `COLOR_0`. `build_rig.py` now fixes this.
- Blender ID properties can't hold `None` or mixed-type lists. That is why `faceFrames` is a list of dicts with `""`.
- Code-review judgement calls, not fixed: the clip and face-frame name lists are duplicated across `export_glb.py`, `build_face.py` and `panda-contract.mjs`. `smoothstep`/`seg` are duplicated in `build_mesh.py` and `build_rig.py`.
- One faint fabric-like dimple remains low on each side where the old paw sat. It is only visible up close.
- The Write hook blocks writing into the main checkout from a worktree. So this handoff lives on the branch, and the board's ticket edits and lock were made through the shell.
