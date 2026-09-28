# Handoff: ticket 07 (props on sockets + Brain idle habits) → ready-for-human

**Blender MCP tools**: present and working this session. Preflight `mcp__blender__get_objects_summary` succeeded before claiming: scene `PandaAsset` with `PA_Panda`, `PA_Rig` (armature), `SNAP_Cam`, `face`, matching ticket 03/04's state. The ticket's stale "no Blender tools" comment does not apply here.

## Branch and commits

Worktree `worktree-agent-a69e9e9b544d18a5f`, branch `worktree-agent-a69e9e9b544d18a5f` (built on `main` tip `157cdeb`):
- `04b3e66` — Ticket 07: Brain-type props and idle habits
- `dc5e751` — Ticket 07 review fix: decouple cell type from the state timeline
- `beb4ea0` — Ticket 07 spec-review fixes: force working on cell-type pick, fix docstring

## What's done (all 4 acceptance criteria)

- **Contract** (`apps/ui/src/assets/panda-contract.mjs`): three new clips `fan_tap_and_point`, `scroll_unroll`, `blueprint_unroll`, all in `CLIPS` and `LOOPS`. New `PROP_ASSETS` maps each Brain type to its prop file, socket and habit clip (orchestrator→fan/paw_R, product→scroll/paw_L, architect→blueprint/paw_L).
- **Director** (`packages/character-director/src/director.mjs`): `setCellType(cellId, cellType)` + `HABIT_LOOPS`. When a cell's state is `working` and its type has a habit, `tick()` substitutes the habit clip for the generic `breathe` (loop/enter/heldPose all become the habit clip). Cell type lives in its own `Map`, independent of the state timeline (a code-review fix — see below).
- **Blender pipeline** (`apps/ui/assets-src/panda/`): `build_clips.py` authors the three habit loops as BEAT-length (1.2 s) loops on `arm_L`/`arm_R`/`head`, reusing the existing `AIM`/`W` helpers. New `build_props.py` builds the fan (red pie-wedge), scroll (tan cylinder) and blueprint (slate-blue thin sheet) as separate static meshes and exports each to `apps/ui/public/models/props/*.glb`. `export_glb.py`'s `CLIPS` list picks up the three new animations. `panda.glb` rebuilt; `npm test`'s "the exported panda.glb satisfies the contract" passes.
- **Scene wiring** (`apps/ui/src/scene/dev-scene.mjs`/`.html`): a new "Cell type" dev control. Picking a Brain type calls `director.setCellType` and attaches the matching prop glb as a child of the named socket bone (`paw_L`/`paw_R`), found by `panda.getObjectByName(socket)`; picking "generic" detaches it. Since the prop is parented to the socket `Bone`, it follows every clip automatically through skinning — no per-clip wiring needed.

## Code review (both axes, run in parallel sub-agents against `git diff 157cdeb...HEAD`)

**Standards.** One real finding, fixed in `dc5e751`: `setCellType` seeded a brand-new cell's `since` at literal `0` (via `cellOf(cellId, 0)`), which would have skewed the `dur-fast` cross-fade window if a caller ever called `setCellType` before that cell's first `setState`. Fixed by moving cell type into its own `Map`, decoupled from the state timeline entirely; added a regression test (`director.test.mjs`, "setCellType before the first setState still cross-fades normally"). Other findings were judgement calls the reviewer itself called defensible at this scale (three habit-clip functions in `build_clips.py` share a shape but each differs enough to not obviously warrant a shared helper yet; `HABIT_LOOPS`/`PROP_ASSETS` are a second source of truth for the cellType→clip pairing, matching the repo's existing `STATE_MAP`/`CLIPS` cross-check convention).

**Spec.** Two findings, both fixed in `beb4ea0`:
1. **UX gap (fixed):** the cell-type dev control called `setCellType`/`applyProp` but never forced `state: "working"`, and `mappingFor` only substitutes the habit clip for `working` — so picking a type alone did nothing visible until the tester separately clicked "working". Picking a cell type now also drives the state to working.
2. **Docstring overclaim (fixed):** `build_props.py`'s `make_blueprint` docstring said "held in both paws" when `PROP_ASSETS.architect` only attaches it to `paw_L` (both arms move as it unrolls, but only one paw carries the geometry). Reworded.

Also flagged, left as-is (correct scope per spec.md's own testing decision, which only asks the contract check to verify bones/sockets/clips/face-frames exist — not that a prop's transform tracks the socket through every clip, which is structurally guaranteed by `Bone` parenting instead): the asset contract and its tests don't independently verify a prop's world transform follows its socket across clips, and the new prop-glb test only checks each file parses with ≥1 mesh, not that its local origin sits where documented. Both are testable follow-ups if this becomes load-bearing later, not blockers now.

## Self-checked against the ticket's acceptance criteria

1. Props/hats attach by socket name, follow through all clips — via `Bone` parenting (see above); verified by reading the socket bones are joints in the skin (existing contract check) and confirming the attach code targets them by name.
2. Three habit clips in the glb, pass asset contract — `npm test` green (29/29), including the exported-glb contract test.
3. Director maps `working` to habit loop, tested — 6 new/changed tests in `director.test.mjs` cover the mapping, the fallback to `breathe` for un-modeled types, that other states are unaffected, and the `setCellType`-ordering regression.
4. Distinguishable in the scene — the dev-scene's cell-type control switches pose + prop live. Caveat: `dev-scene.mjs` is still a single-cell scene (ticket 04's scope), so "distinguishable" today means switching one cell between types, not three cells shown side by side simultaneously — there's no multi-cell scene yet to show them at once. Flagging this rather than silently declaring it fully met.

## Visual check I could do vs. what needs the user

- Rendered the fan/scroll/blueprint props (Blender viewport render) and confirmed via the exported glTF JSON that their `baseColorFactor`s are correct (red/tan/slate-blue) — Blender's own viewport preview wasn't showing material colour for an unrelated reason I didn't chase down (tooling quirk, not an asset problem).
- Posed the rig at each new clip's midpoint (`fan_tap_and_point`, `blueprint_unroll`) and rendered: arms stay inside the body's silhouette, no visible stretching/tearing at the shoulder join in either pose.
- **This session has no browser/computer-use tool** (same limitation ticket 04's handoff noted), so I could not open `dev-scene.html`, click through the cell-type buttons, and confirm the props visually sit right in the paw, look distinguishable at a glance, and that the habit loops read as intended (tap/point, unroll, unroll). **That in-browser pass is the visual verdict this ticket needs before it's fully done.**

## How to check it

```
python -m http.server 8124 --directory D:/claude_sessions/agent_office/.claude/worktrees/agent-a69e9e9b544d18a5f
```
Open `http://localhost:8124/apps/ui/src/scene/dev-scene.html`, click "working" then each of orchestrator/product/architect under "Cell type (ticket 07 idle habits)".

## Left to do

1. A human (or a session with a browser tool) opens the dev scene and confirms the three habits read as distinct and the props sit naturally in the paw.
2. Ticket status is `ready-for-human`; flip to `resolved` once the visual verdict is in.
