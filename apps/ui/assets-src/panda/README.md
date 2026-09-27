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
| `build_mesh.py` | Copies `PlushBase`, melts the fused Meshy arms back into the body shell (a masked voxel remesh and smooth), then adds two separate sewn-on arms. Each arm has a ball shoulder centred on its bone, so a raised paw never stretches skin. |
| `build_rig.py` | Builds `PA_Rig` with 9 deform bones plus the `paw_L`, `paw_R` and `hat` sockets. It binds the arms rigidly to their bones and smooth-weights the rest, then joins everything into one skinned mesh. |
| `build_face.py` | Removes the baked sleepy eyelids and draws `face-atlas.png`. It then builds the `face` decal: a thin shell over the front of the head, skinned to `head`. |
| `build_clips.py` | Authors every clip as an action, with its `loop` and `faceFrames` metadata. |
| `export_glb.py` | Writes the glb (actions become named animations, custom properties become extras) and `panda.blend`. |

## Face atlas

The atlas has `cols × rows` cells. The `face` mesh's UVs cover cell 0. To show frame `i`, offset the texture by `(i % cols / cols, floor(i / cols) / rows)` in glTF UV space (v runs down). In three.js, set `material.map.offset`. The `face` node's `extras.faceAtlas` holds `{cols, rows, defaultFrame, frames: {name: index}}`.

A clip can select faces too. `extras.faceFrames` on an animation is a list of `{t, frame}` entries, where `frame: ""` hands the face back to the director. `blink` and `doze` use this.

## Check it by eye

```bash
python -m http.server 8124 --directory apps/ui
```

Open http://localhost:8124/assets-src/panda/viewer.html. It plays each clip and face frame from the front, three-quarter and side views. three.js loads from jsdelivr, so it needs a network connection.
