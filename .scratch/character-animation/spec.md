# Spec: Character animation

Status: ready-for-agent

## Problem Statement

Bao and the cells are plush pandas that can only move as whole bodies. The model is not rigged, so the state poses, idle habits and emotes in the design system (`cell-types.md`, `motion.md`) cannot be shown. A user watching the organism can't tell at a glance what a cell is doing from its body language, handoffs have no choreography, and cells can't move between perches. Without character motion the organism looks like a diorama of statues instead of something alive.

## Solution

One small hand-placed skeleton is shared by Bao and every cell, and one clip library drives it. The daemon only reports cell state. The UI maps each state to a looping clip plus a transition one-shot, moves cells between perches along procedural hop or waddle paths, and plays the handoff choreography. Faces change through a texture-swap atlas. Bao has its own calm ambient life. Everything stays calm (no loop faster than `dur-heartbeat`), and `prefers-reduced-motion` turns every state into a held pose. The web build uses baked fur, not shells.

## User Stories

1. As a user, I want each cell's pose to show its state (idle, working, waiting_on_user, blocked, done, failed, throttled, terminated), so that I can read the organism at a glance without opening a panel.
2. As a user, I want a working cell to loop its type's idle habit with its prop, so that I can tell cell types apart by what they do.
3. As a user, I want a cell waiting on me to turn toward the camera and raise a paw with a gentle bob, so that I notice it needs me.
4. As a user, I want a blocked cell to sit back with arms folded and look toward its blocker, so that I can see what it is stuck on.
5. As a user, I want a failed cell to drop its prop and lower its head, never looking hurt or crying, so that failure reads clearly but stays gentle.
6. As a user, I want a throttled cell to doze off mid-task with a slowed breath, so that I can see Endocrine limits acting.
7. As a user, I want a done cell to lean back satisfied with its prop put away, so that finished work feels finished.
8. As a user, I want a terminated cell to wave once and then fade to ghost, so that apoptosis is visible and kind.
9. As a user, I want an idle cell to sit still with eyes closed to a line and its prop set down, so that idle and working look different.
10. As a user, I want working cells to breathe gently, so that live cells look alive.
11. As a user, I want a handoff to show the sender pointing, a qi bead travelling the pathway, and the receiver looking up with a heart bubble, so that I can follow work moving between cells.
12. As a user, I want nobody to leave their perch during a handoff, so that busy organisms don't become chaotic.
13. As a user, I want a cell moving across a gap between body parts (crown, shoulder, knee, grass) to hop in bouncy arcs, so that long moves read at Level 1 distance.
14. As a user, I want a cell moving a short distance on the same surface to waddle, so that small moves feel charming rather than jumpy.
15. As a user, I want cells to reach any perch from any perch without hand-authored routes, so that new perches and cells just work.
16. As a user, I want a cell whose state changes mid-move to react immediately, so that the picture never lags behind the real state.
17. As a user, I want a cell interrupted mid-hop to drop to the nearest surface, land with a squish and take its new state there, so that nothing floats or teleports.
18. As a user, I want Bao's belly to breathe slowly all the time, so that the organism feels alive.
19. As a user, I want Bao's head to drift slowly and blink occasionally, so that it doesn't look frozen.
20. As a user, I want Bao to glance toward the Approval Inbox while any approval waits, so that I'm nudged toward it without an alert.
21. As a user, I want Bao to yawn once after the organism has been idle for a while, and doze if it stays idle, so that quiet periods feel restful.
22. As a user, I want expressions (blink, content squint, wide eyes, half-lidded, focused squint, narrowed, eyes shut savoring, sour pucker, sleepy, yawn) to change crisply, so that faces stay readable at small size.
23. As a user, I want props and hats to stay attached to the paws and head as they move, so that a cell's identity never breaks.
24. As a user, I want all seven modeled cell types (orchestrator, product, architect, developer, scout, security, qa) to have their idle habit, so that security and qa are ready when their genomes exist.
25. As a user, I want nothing to loop faster than `dur-heartbeat`, so that the scene stays calm even with 30 cells.
26. As a user with reduced motion enabled, I want every state shown as a held pose and expression with no loops, breathing, blinks or sway, so that I get the same information without motion.
27. As a user with reduced motion enabled, I want travel to become a `dur-base` cross-fade at the destination, so that position changes are still clear.
28. As a user, I want state to always be shown by icon and word as well as pose, so that motion is never the only signal.
29. As a user, I want Bao and cells to share one body and one clip library, so that the look is consistent at every zoom level.
30. As a user, I want the plush look (fuzzy, soft, no ink outlines) to hold in the browser with 30 cells, so that the web app matches the renders without dropping frames.
31. As a developer cell, I want the state-to-clip mapping as a pure module with no renderer dependency, so that I can test it quickly.
32. As a developer cell, I want the exported asset to follow a named contract (bones, sockets, clips, face frames), so that I can check a new export automatically.
33. As a designer, I want a throwaway three.js motion test of one rigged cell before the full library is built, so that the rig and feel are confirmed early.

## Implementation Decisions

- **Rig.** One hand-placed skeleton of about 10 deform bones: root, body (belly), head, ear L/R, arm L/R, leg L/R. Socket bones for paw L, paw R and hat hold props and hats. No auto-rig, no humanoid skeleton. Bao uses the same rig at 11x scale.
- **Faces.** The baked sleepy face is replaced by a face decal driven by a small sprite atlas (eyes and mouth frames). Clips and the director select frames; no facial geometry or shape keys.
- **Clip library (shared, all in place).** breathe (loop, `dur-breath`), blink (one-shot), look-at (procedural head aim, layered), paw-raise with bob (loop, `dur-heartbeat`), hop (one-shot: anticipate squash, air, land squish), waddle (loop), land-squish (one-shot), doze (loop, breath at 2x `dur-breath`), slump (failed pose), arms-folded (blocked pose), lean-back (done pose), wave (terminated one-shot), point (handoff send), look-up (handoff receive), sit-still (idle pose).
- **Per-type idle habits.** One prop loop for each of the seven modeled types, as described in `cell-types.md` (fan tap and point, scroll unroll, blueprint unroll, music bob and sip, lantern peer, wall stare, sip and nod or pucker).
- **Bao-only clips.** slow head sway (loop), glance at inbox (look-at target), yawn (one-shot), doze.
- **State → clip map.** Each state resolves to a looping clip, an entry one-shot, a face frame, and a held pose for reduced motion. The daemon only sends state; the UI's character director owns the mapping. Events do not fire extra clips, apart from the handoff choreography and travel.
- **Interrupts.** A state change cross-fades immediately (`dur-fast`), even mid-travel or mid one-shot. If the cell is airborne mid-hop, it drops to the nearest surface point on Bao or the grass, plays land-squish, and its perch becomes that point.
- **Travel.** Procedural: the director computes a path between perch anchors and moves the root while an in-place clip plays. Hop arcs when the destination is on a different body region (crown, shoulder, knee, grass); a surface-hugging waddle when it is on the same region.
- **Handoff choreography.** Sender plays point, the qi bead travels the pathway (per the existing Signaling spec), receiver plays look-up with a heart bubble. No cell changes perch.
- **Calm rule.** No loop period shorter than `dur-heartbeat`; blinks, glances and yawns are spaced at random intervals no shorter than `dur-heartbeat`. Motion tokens come from the design system.
- **Reduced motion.** Every state shows its held pose and face frame; no loops, breathing, blinks or sway; travel becomes a `dur-base` cross-fade at the destination.
- **Fur on the web.** Baked fuzz in the textures plus a rim-light shader. No fur shells in the web build. Blender renders keep shells.
- **Export.** One glTF binary with the shared rig, mesh, face atlas and every clip as a named animation. Props and hats are separate assets attached to sockets by name. Blender actions are the source for clips.
- **Asset contract.** The bone names, socket names, clip names and face-frame names above form a contract the export must satisfy.

## Testing Decisions

- Test external behavior only: what the director outputs for given inputs, and what the asset contains, not how either is built.
- **Character director** (the one main seam): a pure module taking cell state changes, handoff events, perch anchors, reduced-motion flag and time, and returning clip, face-frame and root-transform commands. Tests cover every state's mapping, immediate interrupts, the mid-hop drop, hop vs waddle choice, handoff choreography, the calm rule, and that every state has a reduced-motion held pose.
- **Asset contract check:** loads the exported glTF and verifies required bones, sockets, clips and face frames exist, and that no looping clip is shorter than `dur-heartbeat`.
- Visual feel is judged by the user in the prototype, not by tests.
- No prior art yet: there is no app code in the repo.

## Out of Scope

- Fur shells in the web build.
- Facial geometry or shape keys.
- Event-driven one-shots beyond handoffs and travel (e.g. per tool call).
- Cells carrying work or visiting other cells during handoffs.
- Genomes for security and qa (a separate session); only their clips are in scope.
- Planned cell types not yet modeled (drummer, librarian, painter, cub).
- Mitosis, differentiation and apoptosis whole-body effects already specified in `motion.md` (they stay as specified and layer on top).
- Camera motion.

## Further Notes

- The first ticket should be a throwaway prototype: rig one panda in Blender, author breathe, paw-raise, hop and waddle, export, and cycle every state in a three.js motion test with a hop and a waddle. The user confirms feel before the full library is built.
- For the architect: whether distant cells (Level 1, up to 30) update animation at a reduced rate, and where the character director lives relative to the scene renderer.
- Blender MCP calls time out on renders over about 30 s; queue with `bpy.app.timers.register`.
- The plush origin is the model centre; place cells at surface + `CELL_SCALE`.
- Source design: design system artifact (`motion.md`, `cell-types.md`) and `.scratch/_handoffs/2026-09-26-design.md`.

## Layout update (2026-09-29)

The user chose the banquet market layout (ADR 0013, proposed): only the Pass rides on Bao; other stations are market stalls around a banquet table whose lazy susan is the queue. Mockups: https://claude.ai/artifact/LQjpimx1jfX5bjZEoTo3za. New tickets 14 to 19; 05 and 06 rescoped.
