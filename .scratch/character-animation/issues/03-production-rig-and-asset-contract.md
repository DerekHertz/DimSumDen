# 03: Production rig, face atlas and asset contract

**What to build:** The production panda asset that every later ticket builds on. It uses the shared hand-placed rig with paw L, paw R and hat sockets, and replaces the baked sleepy face with a face decal driven by a sprite atlas (eye and mouth frames). The state clips are sit-still, breathe, blink, paw-raise, arms-folded, slump, lean-back, doze and wave. Everything exports as one glb. An automated asset contract check loads the glb and verifies the required bones, sockets, clips and face frames, and that no looping clip is shorter than `dur-heartbeat`.

The production mesh must give the arms geometry that's separate from the body (or topology/weighting that lets the arms lift cleanly) so raising a paw or waving shows no stretched or distorted skin between arm and belly. This is a direct requirement from the user's verdict on ticket 01 (motion test prototype): "the arm should be separate from the body. right now the skin stretches and makes a really ugly distorted look."

Findings carried over from ticket 01 (see `handoffs/01-developer.md` and ticket 01's Comments):
- Bone names use `_L`/`_R` suffixes (not dots) since three.js strips dots from bone/object names on glTF export/import.
- Ticket 01 used procedural (automatic/heat-map) skin weights, which is what produced the fused-looking arm/belly deformation; this ticket needs deliberate weight painting or a mesh topology change, not another procedural pass.
- `check-glb.mjs` (built for ticket 01's smoke test) is a starting point for this ticket's automated asset contract check — extend it rather than starting from scratch.
- The current Meshy-generated base mesh fuses the arms to the belly; this ticket needs to either re-sculpt/re-topologize that seam or source geometry that separates arm from torso before rigging.

**Blocked by:** 01 (rig and feel confirmed by the user), 02 (package layout)

**Status:** resolved

- [x] Rig matches the spec's bone and socket names exactly
- [x] The face atlas holds the spec's frames: blink, content squint, wide eyes, half-lidded, focused squint, narrowed, eyes shut savoring, sour pucker, sleepy, yawn
- [x] The glb contains the state clips listed above as named animations
- [x] The contract check runs as a test and passes; it fails if any required name is missing or any loop is shorter than `dur-heartbeat`
- [x] Any feel changes the user asked for in 01's verdict are applied
- [x] paw_raise and wave, viewed from the front and three-quarter angles, show no stretched or tearing faces where the arm meets the body (the arm reads as a separate, cleanly-deforming part) — user verifies visually
- [x] Follow-up for the user (`ready-for-human` note in Comments): update the stale "Characters (open)" section in `motion.md` and the "Now vs. target" note in `cell-types.md` in the design system artifact

## Comments

- **Requirement folded in (orchestrator, 2026-09-26):** Added the user's ticket-01 verdict (arm must be separate from body; no stretched skin) as a requirement and a visual acceptance criterion (paw_raise / wave, front + three-quarter views). Carried over ticket 01 findings on bone naming, skin weighting, `check-glb.mjs`, and the fused Meshy mesh. Ticket is unblocked (01 and 02 both resolved) and confirmed `ready-for-agent`. Must run as a main-session `developer` (`claude --agent developer`) with Blender open — a subagent dispatch does not get the Blender MCP tools (see ticket 01's history).
- **Ready for human (developer, 2026-09-26):** Built on branch `claude/production-rig-asset-contract-6a1723` (`57f6ba2`); `npm test` passes (9/9). Please check paw_raise and wave from front and three-quarter views: `python -m http.server 8124 --directory apps/ui`, then open http://localhost:8124/assets-src/panda/viewer.html, and record your verdict here. Handoff: `.scratch/character-animation/handoffs/03-developer.md` on that branch.
- **Follow-up for the user (ready-for-human):** in the design system artifact, update the stale "Characters (open)" section in `motion.md` and the "Now vs. target" note in `cell-types.md`. Characters now use a shared hand-placed rig with separate sewn-on arms, a face-atlas decal (11 frames incl. `neutral`), and a glb clip library checked by an asset contract.
- **Ready for human again (developer, 2026-09-26):** Applied the arm/proportion critique: arms ~1.3x thicker and longer, shoulder forward, arms_folded paws now overlap, black shoulder band, front paw pads, chin disc removed; head/belly proportions left as-is per user. Commit 31c6fc9; `npm test` 9/9. Re-check in the viewer and record your verdict here.
- **Ready for human, round 3 (developer, 2026-09-26):** Second critique applied: arms tapered (0.44 shoulder / 0.34 wrist / 0.38 paw), length ~0.8, resting arm inside the body outline (0.91 vs 0.97), folded forearms cross high with left on top, softer band + white front flank so arms keep their outline, flank pits smoothed. Commit 1fa18f8; `npm test` 9/9.
- **User verdict (via chat, 2026-09-26):** "looks good now!" after round 3. Arms accepted. The design-system follow-up (motion.md / cell-types.md) stays with the user, per the note above.
