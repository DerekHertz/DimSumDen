# 07: Props on sockets + Brain idle habits

**What to build:** Cells carry their identity. Props and hats attach to the paw and hat sockets by name, as separate assets, and stay attached through every clip. A working orchestrator, product or architect cell loops its type's idle habit with its prop, as described in `cell-types.md` (fan tap and point, scroll unroll, blueprint unroll).

**Blocked by:** 04

**Status:** resolved

- [x] Props and hats attach by socket name and follow paws and head through all clips
- [x] The three Brain habit clips are in the glb and pass the asset contract check
- [x] The director maps `working` to the cell type's habit loop (tested)
- [x] In the scene, each of the three types is distinguishable by its habit

## Comments
- **Needs main-session Blender run (orchestrator, 2026-09-26):** requires new glb clips/textures per its acceptance criteria; subagent dispatch has no Blender MCP tools. See .scratch/character-animation/handoffs/00-orchestrator-2.md.
- **Correction (main session, 2026-09-26):** The "no Blender MCP tools" note above is stale. A developer subagent dispatched from the main session has all six `mcp__blender__*` tools and read the open PandaAsset scene. Dispatch normally; the developer probes Blender before claiming.
- **Developer handoff (2026-09-27):** implemented; see `handoffs/07-developer-1.md`. Needs the users visual verdict in-browser (this developer session has no browser tool) before this closes.
- **Design bounce (designer, 2026-09-26):** critiqued in-browser (`dev-scene.html` served locally, patched only in a scratch copy to work around two bugs below) against `cell-types.md`, `motion.md` and the zoom-frame/design-system artifacts. Ranked findings:

  - **HIGH — `dev-scene.html` fails to load in any real browser.** `apps/ui/src/assets/panda-contract.mjs:3` does `import { readFileSync } from "node:fs"` at module top level. `apps/ui/src/scene/dev-scene.mjs` imports `PROP_ASSETS` from that same file for browser use, so the whole module graph fails with `TypeError: Failed to resolve module specifier "node:fs"` / "Failed to fetch dynamically imported module" in Chromium — confirmed by dynamic-import probing each of dev-scene.mjs's imports individually, isolating the failure to this one file. This is why the developer's own handoff and this review both initially saw a blank "loading…" screen with no console-visible cause (module scripts swallow the failure silently, no try/catch around the top-level `await`). **Fix:** move `readFileSync` out of the top-level import — lazy/dynamic-import it inside `readGlbFile` (`panda-contract.mjs:37-39`, the only caller, used only by Node-side tests) — or split the Node-only glb-reading helpers into a sibling module so the browser-safe constants (`PROP_ASSETS`, `CLIPS`, etc.) have no `node:` dependency. Until this is fixed, acceptance criterion 4 ("distinguishable in the scene") cannot be verified by anyone opening the page normally.

  - **HIGH — once that's patched, none of the three props render visibly during their habit loops.** Verified by instrumenting the attach code to print each prop's post-attach world-space bounding box: fan (`props/fan.glb`, socket `paw_R`) measured `worldBoxSize ≈ 0.262 × 0.024 × 0.163`, i.e. its thin axis (~0.024, matching the flat pie-wedge built in `build_props.py`'s `make_fan`) stays close to world-Y — the fan is lying nearly flat/horizontal in this pose, so from the front/three-quarter angle used to view a working cell it presents edge-on and reads as an invisible sliver, not a fan shape. Materials, mesh count and scale are all correct (doubleSided, right `baseColorFactor`, scale 1,1,1, local pos 0,0,0), so this isn't a load failure — it's an orientation problem. Scroll (a solid rod, `worldBoxSize ≈ 0.30 × 0.09 × 0.09`, visible from any angle in principle) and blueprint were also not visible on screen in their poses; the likely cause there is that each prop's local origin sits at exactly the socket's origin with no offset outward into the grip (`build_props.py`'s own comment: "object origin at (0,0,0) is where it meets the socket"), so the prop is centered inside the paw's fist geometry instead of extending out of it. **Fix:** (a) give the fan a fixed local rotation in `make_fan` so its wide face points outward from the grip rather than lying flat; (b) for all three props, offset the local origin outward along the grip axis by a few cm so the visible body clears the fist mesh; re-check by screenshotting `dev-scene.html` (or a Blender pose check) after each change, not just by the contract test (which only checks each glb parses with ≥1 mesh, per the developer's own code-review note).

  - **MEDIUM — prop colour doesn't follow the design system's own rule.** `cell-types.md`: "A cell type's personality comes from a hat and a held prop **in its organ hue**." Orchestrator/product/architect are all Brain (organ-brain = wisteria, `#674698` light / `#c3a5f9` dark), but `build_props.py` hardcodes narrative colours instead: fan lacquer red `(0.62,0.11,0.11)`, scroll parchment tan `(0.80,0.70,0.48)`, blueprint slate blue `(0.42,0.55,0.68)`. **Fix:** recolor the three materials into the organ-brain hue family (vary lightness/saturation per prop for shape-driven variety, the way `organ-*-zone` tones vary elsewhere in tokens.json), or — if the team actually wants narrative per-prop colour — correct `cell-types.md`'s wording instead so the system and the asset agree.

  - **LOW — once props are visible, re-check that the three habits still read as distinct at a glance.** Structurally the three clips are well differentiated in code (`fan_tap_and_point` swings `arm_R` only, `scroll_unroll` swings `arm_L` only, `blueprint_unroll` swings both arms with a bigger spread), which satisfies the letter of "distinguishable by its habit." But the swing amplitude is subtle (~15-20°, `build_clips.py`'s `W(...,±8)`/`W(...,∓10)`), so right now "which arm moves" is carrying all of the distinctness. Worth a quick look together with the prop fixes above, not a separate pass.

  - No finding on loop speed: `BEAT = 36` frames at `FPS = 30` = 1.2s, matching `dur-heartbeat` (1200ms) exactly — not faster, so the calm rule holds.

  Design verdict: **bounce**. Sending back for the two HIGH fixes (browser load, prop visibility) before another visual pass; the colour and distinctness items can ride along in the same pass.

- **Developer fix round 1 (2026-09-26):** designer's HIGH/HIGH/MEDIUM findings fixed; see `handoffs/07-developer-2.md`. LOW finding left for the designer's re-check.
- **Design bounce, round 2 (designer, 2026-09-26):** re-checked `worktree-agent-a926ab2096132ef97` at `a5e42bc` in the Browser pane. The page, every module, `panda.glb` and each prop glb returned 200, and the HUD shows the clip line, so the module graph loads.

  | reading | round 1 | now | reference |
  |---|---|---|---|
  | page loads in a browser | no (`node:fs`) | yes | - |
  | fan world box at rest (x, y, z) | 0.262 x 0.024 x 0.163 (flat) | 0.262 x 0.160 x 0.024 (upright) | paw radius 0.19 |
  | fan: farthest point from the socket | about 0.21 | 0.21 (0.16 tall, +/-0.131 wide) | paw radius 0.19 |
  | scroll: centre offset from the socket / far face | 0 / 0.045 | 0.06 / 0.105 | paw radius 0.19 |
  | blueprint: far edge from the socket | about 0.13 | 0.19, sheet thin on world Y (0.012) | paw radius 0.19 |
  | prop colour | red / tan / slate | wisteria family (linear 0.38,0.23,0.61 / 0.63,0.52,0.80 / 0.25,0.14,0.42) | organ-brain |

  Where the paw radius comes from: `measure-glb` gives an arm tail thickness of 0.38. The socket sits 0.19 inside the arm tip (socket |x| is 0.72, arm reach is 0.91), so the socket is at the centre of the paw.

  - **Fixed (HIGH, browser load).** `dev-scene.html` loads with no module errors.
  - **Fixed (MEDIUM, colour).** All three props are in the organ-brain wisteria family, varied by lightness.
  - **HIGH, still open: the props are still inside the paw.** In the browser:
    - `fan_tap_and_point` (side view from the panda's right, dollied in): no fan shows.
    - `scroll_unroll` (front view): no scroll shows.
    - `blueprint_unroll` (three-quarter left): only a 1px lilac sliver of the blueprint shows.

    The server served the fan and scroll glbs (200), so the props are attached but buried.

    Cause (confirmed from the numbers): the round-1 fixes turned the fan upright and moved the scroll 0.06, but every prop still lies within about 0.19 of the socket, which is the paw's own radius:
    - The fan's whole wedge (0.16 tall) fits inside the paw.
    - The scroll's front face (0.105) is inside the paw, and its 0.30 length lies along the forearm axis (world X at rest), inside the arm.
    - The blueprint's far edge (0.19) only just reaches the paw surface, and the sheet lies flat, so it shows edge-on.

    The developer's check measured orientation and the 0.06 shift, but never compared each prop's extent with the paw's radius. Code: `build_props.py` (`GRIP_OFFSET = 0.06`, `make_fan`, `make_scroll`, `make_blueprint`).

    **Fixes, with targets:**
    1. Put each prop's grip point on the paw surface, not at its centre. Offset it 0.20 to 0.22 along the paw's outward axis (the one that faces the camera in the habit pose).
    2. Fan: keep the upright orientation, which worked. Put the hinge on the paw surface (offset about 0.18) and make the blade radius 0.24 to 0.28, so at least 60% of the wedge is outside the paw.
    3. Scroll: turn it so its length runs across the paw (perpendicular to the forearm), not along the arm. Centre it about 0.24 from the socket (0.19 plus its 0.045 radius) so the whole rod clears the paw.
    4. Blueprint: stand the sheet up to face the camera in the unroll pose (thin axis on world Z at rest, not world Y). Put its near edge on the paw surface, which puts its centre about 0.32 from the socket (0.19 + 0.13).
    5. Before handing off, check the numbers: at least 60% of each prop's bounding box lies outside a sphere of radius 0.19 around its socket. Then ask for eyes on `dev-scene.html` before the next design round, since the contract test only checks that each glb parses.
  - **LOW, deferred.** With no props showing, the three habits read only by which arm moves: the orchestrator raises the right arm, the product raises the left paw, and the architect reaches forward with both arms. Those silhouettes do differ, so the letter of the criterion holds. But the product and architect both hold their prop in `paw_L`, and from the front they look alike at a glance. I'll judge this once the props show.

  **Check first:** `blueprint_unroll`, front view. The whole wisteria sheet shows in front of the paws, not a sliver.

  Design verdict: **bounce.** Status is back to `ready-for-agent` for the prop-offset fix.
- **Agreed next step (user + main session, 2026-09-26):** Prop visibility (HIGH-2) has failed twice. Round 3: a `developer` on **Opus**, with the designer's numeric targets from `handoffs/07-designer-2.md` (grip offset 0.20–0.22, fan radius 0.24–0.28, scroll across the paw, blueprint upright) turned into hard tests of world-space bounds. Start from `worktree-agent-a926ab2096132ef97`. Then designer round 3, the user's view, qa verify, security, and the merge proposal. Paused at 84% of the 5-hour limit; resume after reset.
- **Developer fix round 3 (2026-09-27):** HIGH-2 fixed on `worktree-agent-aad01bd255e8ec60a` (`d6d2a09`, `5009afd`, based on `a5e42bc`). The designer's targets are now hard world-space tests in `apps/ui/src/assets/prop-placement.test.mjs` (12 tests, red before and green now). At least 60% of each prop's box is outside the 0.19 paw: fan 99%, scroll 100%, blueprint 100%. Two targets deviate, with reasons in `handoffs/07-developer-3.md`: the forearm points toward the camera, not along world X, and the blueprint's centre is 0.30. Checked in Blender renders from the dev-scene camera, not in the browser. Ready for designer round 3.
- **Design critique, round 3 (designer, 2026-09-27): no HIGH findings, so the ticket goes to `ready-for-human`.** I re-checked `worktree-agent-aad01bd255e8ec60a` at `5009afd` read-only in the Browser pane (800x600, dark and light themes). `dev-scene.html` was served with the `.mjs` MIME fix and `no-store` on port 8163. The console was clean. I took the front and both three-quarter (about 45 degree) views for all three habits, sampled 9 times through each loop with a scratch script (`normals.mjs`, in the session scratchpad) that uses the branch's `prop-placement.mjs`. The branch's 12 placement tests pass.

  | reading | round 2 | now | reference |
  |---|---|---|---|
  | fan: share of box outside the paw | about 1% | 99% | target at least 60% |
  | scroll: share outside | 0% | 100% | target at least 60% |
  | blueprint: share outside | 3% | 100% | target at least 60% |
  | blueprint in the front view | 1px sliver | the whole sheet, about 30x40 px | panda about 305 px tall |
  | fan face toward the front camera (normal z) | edge-on | 0.78 through the loop | 1.0 means face-on |
  | blueprint face toward the front camera | edge-on | 0.80 to 0.89 | 1.0 means face-on |
  | blueprint face, far three-quarter (camera at the panda's right front) | - | 0.25 at mid-loop (edge-on) | near three-quarter 0.74 to 0.88 |
  | fan face, far three-quarter (camera at the panda's left front) | - | 0.41 to 0.55 | near three-quarter 0.56 to 0.70 |
  | blueprint size (w x h) | 0.20 x 0.26 | 0.20 x 0.26 | fan 0.43 wide; head 1.35 wide |

  - **Fixed (HIGH-2, prop visibility).** *Check first* passes: in `blueprint_unroll` from the front, the whole wisteria sheet shows above and in front of the left paw, not a sliver. The fan shows as an open wedge above the raised right paw, and the scroll shows as a lilac rod across the left paw. All three read in the light theme too. I accept both of the developer's deviations:
    - The forearm points toward the camera, so the scroll's length along world X is across the paw.
    - The blueprint's centre is at 0.30, not 0.32. The near edge is on the paw surface (0.203), which is what the target was for.
  - **Fan from the side.** It is edge-on there, as any flat prop that faces the camera would be. Judged from the front and the near three-quarter, it reads well. No change.
  - **LOW, deferred from round 2 (do the habits read as different?): fine now.** Each habit differs in both silhouette and prop shape:
    - orchestrator: the right arm is raised high, with a wedge at the upper left of the screen.
    - product: the left paw is forward, with a horizontal rod at the right of the screen.
    - architect: both arms are spread wide, with an upright card at the right of the screen.

    The round-2 worry was that product and architect looked alike, since both hold their prop in `paw_L`. They now read apart by arm spread (one arm or both) and by prop shape (a rod or a sheet). All three share the wisteria hue, as `cell-types.md` requires, so shape carries the identity.
  - **MEDIUM: the blueprint is too small to read as a blueprint.** At 0.20 x 0.26 it is 15% of the head's width, less than half the fan's 0.43. In the front view it is about 30x40 px next to a 305 px panda, so it reads as a sticky note or a card. At office zoom it will be a few pixels. Cause (confirmed): `build_props.py:49`, `BLUEPRINT_W, BLUEPRINT_H = 0.20, 0.26`. **Fix:** make it a landscape sheet, 0.34 to 0.38 wide and 0.24 to 0.30 tall. Keep:
    - the near edge on the paw surface (closest point 0.17 to 0.23)
    - at least 60% outside the paw
    - the inner edge outside the head's reach (|x| of 0.67) in the front view at mid-loop, so it doesn't cover the face

    Update the size test in `prop-placement.test.mjs` to match.
  - **LOW: the flat props go edge-on from the far three-quarter view.**
    - The blueprint's normal swings from 10 to 29 degrees of yaw toward the panda's left during the loop. From the panda's right-front it faces the camera at only 0.25 at mid-loop, a sliver.
    - The fan faces the camera at 0.41 to 0.55 from the panda's left-front.

    In both cases the prop is on the far side of the body, and both read from the front and the near three-quarter. No fix unless the office camera sits on that side. If it does, the target is a normal within 15 degrees of world +Z through the whole loop, which would face the camera at 0.5 or more from both three-quarters.
  - **LOW: from the near three-quarter (the panda's right-front), the fan covers the panda's right cheek and eye patch.** The eye stays visible, so the `focused_squint` still reads. Optional fix: lower the hinge 0.04 to 0.06 so the top of the wedge clears the eye line.
  - **LOW: the scroll reads as a stick.** `scroll_unroll` never shows it unrolled, so it looks like a plain rod or baton. Optional fix: add end knobs in a darker wisteria, about 1.3 times the rod's 0.09 diameter, so it reads as a scroll.
  - **LOW: in `blueprint_unroll` the right paw holds nothing.** The docstring says both arms spread it open, but the sheet is in `paw_L` only, and the empty right arm spreads wide like a shrug. The larger sheet in the MEDIUM fix narrows that gap. A real two-paw hold is out of scope for a single-socket prop.
  - **Fine:** the loop is 1.2 s (`dur-heartbeat`), there is no stray geometry, and the props stay attached through every loop sample.

  Design verdict: **ready-for-human.** No HIGH findings. The MEDIUM (blueprint size) and the LOWs can ride along with any later pass, or the user can waive them. Next come the user's view, qa verify, and security.
- **User verdict (via orchestrator, 2026-09-27):** Enlarge the blueprint first. Fix round 4 on `worktree-agent-aad01bd255e8ec60a` (5009afd):
  1. Blueprint MEDIUM from `handoffs/07-designer-3.md`: make it a landscape sheet 0.34-0.38 wide and 0.24-0.30 tall (`BLUEPRINT_W`, `BLUEPRINT_H` in `build_props.py`), update its placement test, re-export, and keep all 12 placement tests green.
  2. Environment fix (agreed): `dev-scene.mjs` sizes its renderer on the first frame, not only at load and on resize, so a newly opened Browser pane doesn't render an empty canvas.

  The LOW findings stay open as optional polish. After this: a short designer check on the blueprint size, then qa verify, security, and the merge proposal.
- **Round 4 dispatch failed, environment (orchestrator, 2026-09-27):** A subagent developer got a fresh worktree off `main` (`agent-ae864dac4c2c174c5`, now unused). The permission classifier then denied checkout and merge of `worktree-agent-aad01bd255e8ec60a`. Nothing changed. **Agreed fix (user):** run round 4 as a main-session developer inside `D:/claude_sessions/agent_office/.claude/worktrees/agent-aad01bd255e8ec60a` (`claude --agent developer`). For later rounds that continue an existing branch, dispatch in that branch's worktree, not a fresh subagent worktree.
- **Re-prioritized (user, 2026-09-27):** The organism loop comes before animation polish. Round 4 is cancelled. The blueprint-size MEDIUM and the dev-scene first-frame renderer fix move to follow-up ticket `11-prop-polish.md`. This branch (`worktree-agent-aad01bd255e8ec60a` @ 5009afd) goes to qa verify, then security, then the merge proposal.
- **QA verify (qa, 2026-09-27): QA pass.** Verified `worktree-agent-aad01bd255e8ec60a` @ `5009afd` (based on `a5e42bc`, not today's `main` `aa2489d`).
  - `npm test`: 42/42 pass, 0 fail/skipped, no output truncation.
  - Criterion 1 (props/hats attach by socket name, follow through all clips): generic `attachProp` in `apps/ui/src/scene/dev-scene.mjs:158-181` parents the prop to `panda.getObjectByName(spec.socket)`, so it inherits the socket bone's transform through every clip. `SOCKETS = ["paw_L", "paw_R", "hat"]` in `panda-contract.mjs:11` and the rig contract test asserts the `hat` bone exists (`panda-contract.test.mjs:34-38`); no cell-type habit in `cell-types.md` currently uses a hat, so only the paw sockets are exercised by prop data — consistent with spec.md story 23/decision "Export" (hats are part of the shared socket contract, not a per-habit requirement here). `prop-placement.test.mjs` (12 tests) hard-checks the props' world-space attachment at 9 sampled times through each loop.
  - Criterion 2 (three Brain clips in the glb, pass contract): confirmed directly — `apps/ui/public/models/panda.glb`'s animation list includes `fan_tap_and_point`, `scroll_unroll`, `blueprint_unroll`, and `panda-contract.test.mjs`'s `"the exported panda.glb satisfies the contract"` test (against the real file, not a synthetic fixture) passes.
  - Criterion 3 (director maps `working` to habit loop, tested): `packages/character-director/src/director.mjs:43-57` (`HABIT_LOOPS`, `mappingFor`) is covered by `director.test.mjs:124-161` (contract-clip cross-check, habit-loop substitution, no-habit fallback to breathe, habit scoped to `working` only). All pass.
  - Criterion 4 (three types distinguishable by habit): not automated (visual/holistic), so treating as `human-verified` per the qa contract — verified across designer rounds 1-3 (`handoffs/07-designer-3.md`: distinct arm silhouette + prop shape per type, all three read from front and near three-quarter, in both themes) and the user's own 2026-09-27 verdict in this file's Comments, which asked only for the blueprint-size fix (deferred to ticket 11) and moved the ticket to qa verify.
  - No prior qa-specify pass exists for this ticket (git history has no qa/specify commit for ticket 07), so there's no specify-branch test file to diff for weakened assertions. Diffed all `*.test.mjs` changes across every ticket-07 commit (`dc5e751~1..5009afd`) by hand: only additions and one sync-to-async mechanical edit (`readGlbFile` becoming async, matching the lazy `node:fs` fix); no assertion was removed or weakened.
  - `git merge-tree --write-tree aa2489d worktree-agent-aad01bd255e8ec60a`: clean, single tree written (`7539280916...`), exit 0, no conflict markers. The branch is one merge-base (`157cdeb5`) behind today's `main`.
  - No bounce conditions found. Findings go to security next, then the merge proposal.
- **Security pass (security, 2026-09-27).** Reviewed `worktree-agent-aad01bd255e8ec60a` @ `5009afd`, full ticket diff `04b3e66~1..5009afd`. No critical/high/medium/low findings.
  - No new/upgraded dependency (no `npm audit` needed), no CI/branch-protection change.
  - No secrets, keys, or tokens in the diff or commit history.
  - No CLI shell-out, board/lock-file code, or daemon network-exposure code touched.
  - `panda-contract.mjs:readGlbFile`'s lazy `await import("node:fs")` is sound (Node-test-only caller; browser-safe constants carry no Node dep); guarded by a regression test.
  - `PROP_ASSETS`/`HABIT_LOOPS` are static hardcoded maps; `cellType` values come only from a fixed local enum in `dev-scene.mjs` and tests, never untrusted input -- no path-traversal or injection surface.
  - `build_props.py` is an offline Blender-authoring script (same trust boundary as existing `build_clips.py`/`export_glb.py`), not shipped-app runtime.
  - `prop-placement.mjs` is pure math, Node-test-only.
  See `handoffs/07-security.md`. Next: merge proposal.
- **Resolved (orchestrator, 2026-09-27):** Merged to `main` via PR #7 (`eea046a`).
