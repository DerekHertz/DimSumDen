# Motion test (PROTOTYPE, throwaway)

Ticket 01 (`.scratch/character-animation/issues/01-motion-test-prototype.md`). It checks the shared panda rig and how the motion feels before the full clip library gets built. None of this is app code; ADR 0007 owns the real layout.

## Run

```bash
python -m http.server 8123 --directory prototypes/motion-test
```

Open http://localhost:8123. three.js loads from jsdelivr, so you need a network connection.

- State buttons play each cell state's rough clip. **Cycle states** steps through all 8, one every 4 s.
- **Waddle A↔B** moves along the same surface. **Hop B↔C** jumps up onto the stump. **Travel demo** runs A→B→C→B→A.
- The **speed** slider slows everything down so you can study the feel. **bones** shows the skeleton.

## Files

- `panda-motion-test.glb`: the rig, the mesh and the 10 clips (breathe, paw_raise, hop, waddle, doze, wave, sit_still, arms_folded, lean_back, slump).
- `check-glb.mjs`: checks the glb's contract (bones, sockets, clips, loops at least `dur-heartbeat` long). Run it with `node prototypes/motion-test/check-glb.mjs`.
- `blender/build_rig.py`, `build_clips.py`, `export_glb.py`: run them in that order inside Blender with `design/3d/panda-mascot.blend` open. They build the `MotionTest` scene and write the glb plus `blender/panda-motion-test.blend`.
