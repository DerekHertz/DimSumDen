# 03: Production rig, face atlas and asset contract

**What to build:** The production panda asset that every later ticket builds on. It uses the shared hand-placed rig with paw L, paw R and hat sockets, and replaces the baked sleepy face with a face decal driven by a sprite atlas (eye and mouth frames). The state clips are sit-still, breathe, blink, paw-raise, arms-folded, slump, lean-back, doze and wave. Everything exports as one glb. An automated asset contract check loads the glb and verifies the required bones, sockets, clips and face frames, and that no looping clip is shorter than `dur-heartbeat`.

**Blocked by:** 01 (rig and feel confirmed by the user), 02 (package layout)

**Status:** ready-for-agent

- [ ] Rig matches the spec's bone and socket names exactly
- [ ] The face atlas holds the spec's frames: blink, content squint, wide eyes, half-lidded, focused squint, narrowed, eyes shut savoring, sour pucker, sleepy, yawn
- [ ] The glb contains the state clips listed above as named animations
- [ ] The contract check runs as a test and passes; it fails if any required name is missing or any loop is shorter than `dur-heartbeat`
- [ ] Any feel changes the user asked for in 01's verdict are applied
- [ ] Follow-up for the user (`ready-for-human` note in Comments): update the stale "Characters (open)" section in `motion.md` and the "Now vs. target" note in `cell-types.md` in the design system artifact

## Comments
