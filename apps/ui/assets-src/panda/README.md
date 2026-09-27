# Panda asset

The source for `apps/ui/public/models/panda.glb`: the shared panda rig (ADR 0006), the face atlas, and the clip library. `npm test` checks the glb against the asset contract in `apps/ui/src/assets/panda-contract.mjs`.

## Rebuild

Open `design/3d/panda-mascot.blend` in Blender (5.2) and run the steps in order from the Python console or the Blender MCP:

```python
SRC = r"<repo>/apps/ui/assets-src/panda"
for step in ("build_mesh", "build_rig", "build_face", "build_clips", "export_glb"):
    exec(open(fr"{SRC}/{step}.py").read(), {"PANDA_SRC": SRC})
```

Each step works in the `PandaAsset` scene and leaves `panda-mascot.blend` itself unsaved. `export_glb.py` writes the glb and `panda.blend`, which holds just this scene for inspection.

| Step | What it does |
| --- | --- |
| `rig_spec.py` | Holds the bone names and rest positions, which `build_mesh.py` and `build_rig.py` share. |
| `build_mesh.py` | Copies `PlushBase`, melts the fused Meshy arms back into the body shell (a masked voxel remesh and smooth), then adds two separate sewn-on arms. Each arm has a ball shoulder centred on its bone, so a raised paw never stretches skin. It also paints the black shoulder band and the front paw pads, and removes a stray chin disc. |
| `build_rig.py` | Builds `PA_Rig` with 9 deform bones plus the `paw_L`, `paw_R` and `hat` sockets. It binds the arms rigidly to their bones and smooth-weights the rest, then joins everything into one skinned mesh. |
| `build_face.py` | Removes the baked sleepy eyelids and draws `face-atlas.png`. It then builds the `face` decal: a thin shell over the front of the head, skinned to `head`. |
| `build_clips.py` | Authors every clip as an action, with its `loop` and `faceFrames` metadata. Includes the three Brain-type habit loops (ticket 07): `fan_tap_and_point` (orchestrator), `scroll_unroll` (product), `blueprint_unroll` (architect). |
| `export_glb.py` | Writes the glb (actions become named animations, custom properties become extras) and `panda.blend`. |
| `build_props.py` | Ticket 07: builds the three habit props (fan, scroll, blueprint) as small standalone meshes and exports each to `apps/ui/public/models/props/*.glb`. Not part of the rebuild loop above (run it separately, or whenever a prop's look changes); it doesn't touch `PandaAsset` or `panda.blend`. |

## Props and hats

Props and hats (`apps/ui/public/models/props/*.glb`) are separate assets, not baked into `panda.glb` (spec.md "Export"). A runtime attach parents a prop's root node under the matching `paw_L`/`paw_R`/`hat` socket bone with an identity transform, and the socket's own animation then carries the prop through every clip. `apps/ui/src/assets/panda-contract.mjs`'s `PROP_ASSETS` names each Brain type's prop file, socket and habit clip; `apps/ui/src/scene/dev-scene.mjs` shows the attach/detach.

The socket sits at the centre of the paw, which is a ball of radius 0.19 around it (`PAW_RADIUS`), so a prop built around its origin is buried in the fist. Each prop's grip point sits on the paw surface and its body extends out of it: the fan's hinge sits just past the paw tip and its 0.26 blade rises from it, face to the camera; the scroll lies across the paw, just past its tip; the blueprint stands up facing the camera, just in front of the paw, rising from its bottom edge. The placement constants and the socket-frame axes are at the top of `build_props.py`.

`apps/ui/src/assets/prop-placement.test.mjs` checks the exported props in world space, attached under their sockets in `panda.glb` at rest and through each habit clip: at least 60% of each prop's box outside the paw, the grip point on the paw surface, each prop's orientation, and each prop not hidden behind its paw from the front camera. `apps/ui/src/assets/prop-placement.mjs` does the measuring and can be reused for a new prop.

## Face atlas

The atlas has `cols × rows` cells. The `face` mesh's UVs cover cell 0. To show frame `i`, offset the texture by `(i % cols / cols, floor(i / cols) / rows)` in glTF UV space (v runs down). In three.js, set `material.map.offset`. The `face` node's `extras.faceAtlas` holds `{cols, rows, defaultFrame, frames: {name: index}}`.

A clip can select faces too. `extras.faceFrames` on an animation is a list of `{t, frame}` entries, where `frame: ""` hands the face back to the director. `blink` and `doze` use this.

## Check it by eye

```bash
python -m http.server 8124 --directory apps/ui
```

Open http://localhost:8124/assets-src/panda/viewer.html. It plays each clip and face frame from the front, three-quarter and side views. three.js loads from jsdelivr, so it needs a network connection.
