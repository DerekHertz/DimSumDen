# 09: Headgear and scarf assets for every role

**Type:** asset

**Priority:** P2

**Blocked by:** None

**Status:** resolved

**Design refs:** `docs/design/den-map.md` (coordinates, constants, checks) and `docs/design/2026-09-29-scene-decisions.md` (the why), on branch `design/scene-decisions-0929` until it merges. Target frame: "Level 1 · Den (target)" on the Zoom levels page of the zoom frames canvas (https://claude.ai/artifact/JsxZ5Vj7DxJQbekA2Ehoot). Design system: https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j (Scene, Glossary, Panda roles).

## What to build

Model the headgear and scarf for each role on the shared plush panda, and export them as props that the scene attaches by role. Silhouette tells the role; the scarf's station hue tells the station.

| Role | Headgear | Prop (keep or model) |
|---|---|---|
| orchestrator | chef's toque | ladle |
| product | round spectacles | open menu |
| architect | round spectacles | order slips on a clip |
| developer | headphones | dumpling |
| scout | goggles | magnifier (replaces the lantern) |
| debugger | headlamp | chopsticks lifting a stray hair |
| qa | straw douli hat | teacup |
| security | cap | pantry seal |
| designer | beret | garnished plate |

- One scarf mesh for every role, tinted from the station hue (02). The headgear is soft-matte and plush like the other props, and is tinted with the station hue where it has colour (toque band, beret, cap).
- Headgear must read at Level 1 zoom. The designer's `asset-critique` measures silhouette at the default camera distance.
- Export to `apps/ui/public/models/props/`, add a placement entry per role in `prop-placement.mjs`, and use the shared prop cache.
- Keep the LOD triangle budget: headgear plus prop should be at most ≈ 400 tris per panda at crowd LOD.
- Reference: the "Cell roster" character sheets on the zoom frames canvas (Design session 09-29 page).

**Type:** asset. The relay is developer build, then designer critique rounds, then the user's verdict. Blender sources go in `apps/ui/assets-src/panda/build_props.py`.

## Acceptance criteria

- [ ] Each of the 9 roles has a headgear glb and a placement entry (test on `prop-placement.mjs`)
- [ ] The scarf takes its colour from the role's station hue (test)
- [ ] Scout no longer carries a lantern
- [ ] Per-panda headgear + prop ≤ 400 tris at crowd LOD
- [ ] Designer critique round with no high-severity findings, then the user's verdict

## Comments

- **Created (designer, 2026-09-30):** Filed from the 09-29/30 design session; the user approved every decision in this ticket.
- **orchestrator, 2026-09-30:** Design sweep (designer, user-approved 2026-09-30): Scope added: absorbs ca/16 (Pass idle habits, socket-by-name contract) and ca/11. Low-poly first: blocky headgear judged on whether each role reads at the default camera. Criterion: panda fur is never tinted. Architect pencil fallback if product and architect don't read apart. Add debugger and designer looks.
- **orchestrator, 2026-09-30:** User verdict, 2026-09-30: keep the developer's handheld npm test tablet prop (red 'N failed' / green 'N passed' lines). This answers the open '18 passed chip' question from the design session. Low-poly first: a bevelled slab with a screen plane.
- **orchestrator, 2026-10-01:** Scope changed (user, 2026-10-01): build headgear and props procedurally in Three.js (lathe/torus/cylinder/box, like PR 110's kiosk.mjs and stall-roof.mjs), not as Blender glb assets. Testable with node --test; scarf hue from station tokens; ~400-tri budget still applies. Blender stays for the panda body, rig and clips. Designer critique rounds and the user verdict stay. Visual polish comes in a later pass.
- **designer, 2026-10-01:** UI spec (procedural): pure apps/ui/src/scene/headgear.mjs with headgearSpec(role)/propSpec(role) part lists (lathe/torus/cylinder/box) in socket-local frame, attached by name (hat, paw_L/R), cached via createAssetCache; one shared scarf. Colour only from stationHue(station, theme), live on theme swap; toque band, cap, beret, scarf tinted; neutrals cream/ink/wood/glass, roughness>=0.8; fur never tinted. States: unknown role -> nothing, no throw; reduced motion -> rigid on hat, no extra wobble; crowd LOD <=400 tris headgear+prop+scarf. Silhouette alone separates all 9 roles (no hue-only cue). Developer prop = npm test tablet; scout no lantern; debugger assumed steamers. qa tests 1-6 and role table in handoffs/09-designer-spec.md.
- **orchestrator, 2026-10-01:** Designer's open question answered from docs/design/den-map.md:40 and scene-decisions §97: debugger is a Steamers role (headlamp, chopsticks).
- **qa, 2026-10-01:** qa specify: 105 failing tests at b8895bd on feat/headgear09 (apps/ui/src/scene/headgear.test.mjs). Placement as ROLE_PLACEMENT in panda-contract.mjs. Human-verified: silhouette, reduced motion, contrast, designer critique, user verdict. Open: stationOf('debugger') returns cubs. See handoffs/09-qa-specify.md.
- **orchestrator, 2026-10-01:** Orchestrator, on qa's open questions: (1) ROLE_PLACEMENT in panda-contract.mjs, as the designer spec has it, is accepted; prop-placement.mjs wording is from the glb era. (2) debugger maps to Steamers (den-map:40): keep a role-to-station map in headgear.mjs and leave banquet-layout's stationOf unchanged.
- **orchestrator, 2026-10-01:** Design refs moved (user, 2026-10-01): the shared originals aren't readable by cells. Use the user's copies: design system https://claude.ai/artifact/SCTwbsRq3wEcoYbiYYUUK7 (read project/README.md and project/tokens.json via Artifact read with path), zoom frames https://claude.ai/artifact/AFEGyVKV5s6GbTFraA5U3G.
- **qa, 2026-10-01:** QA verify pass: 105 tests pass, all criteria covered
- **designer, 2026-10-01:** Design bounce (030c706): build runs, no console errors. High: H1 held props point at camera (paw socket +y is world +z; fix rotation (pi/2,pi,0) + flat-prop offset [0,0.26,0.22], verified); H2 product and architect identical at Level 1, build the pencil (r>=0.09, len>=0.7); H3 front-row noren hides qa douli and security cap (noren bottom 1.18 vs hat tip 1.28, needs >=1.55; kiosk/layout call); H4 spectacles, goggles, headlamp, cap brim float 0.3-0.4 off the face, head centre z -0.15, surface-z table in handoff. Medium: cream cup/plate 1.7:1 on belly, scarf under 3:1 vs one fur tone per theme, headphone band merges with ears. Scarf size fine. Details and numbers: handoffs/09-designer-review.md
- **designer, 2026-10-01:** Design bounce: high findings H1-H4 in handoffs/09-designer-review.md; developer round 2 needed
- **orchestrator, 2026-10-01:** User decision on H3 (2026-10-01): raise the front-row eave so the noren bottom clears y 1.55 (eave >= 1.77, drop kept), in 09 round 2. If the FRONT_ROOF sight-line rule or its den-scene-v1/03 tests then fail, adjust the roof apex to keep the back counters visible; if both can't hold, stop and report the numbers rather than editing the 03 tests. Round 2 fixes every numbered finding in handoffs/09-designer-review.md (high, medium and low), including the architect pencil.
- **orchestrator, 2026-10-01:** Round 2 dispatch blocked before claim (2026-10-01): the branch was checked out in the user's review worktree (now detached), and the developer ran the Blender probe because the Type line still says asset/Blender. Blender is not needed for 09 since the procedural rescope; the Type line is from the glb era.
- **orchestrator, 2026-10-01:** M2 (scarf under 3:1 against one fur tone per theme): deferred to the visual polish pass the user asked for later (2026-10-01); the scarf stays pinned to stationHue in 09. Next: qa light verify of a79395d, then designer re-review of H1-H4.
- **qa, 2026-10-01:** All 1516 tests pass. Specify tests unchanged. Three literal updates correct for user's raised-eave decision without weakening assertions. All acceptance criteria mapped to passing tests.
- **orchestrator, 2026-10-01:** User verdict (2026-10-01): the user does the visual inspection of round 2 themselves, so the designer re-review is skipped to save usage. The risk-check hit on headgear.mjs is a false positive (a 'clip board' prop matches the board pattern); security still runs per the rule, on a short brief. Next: security, PR, merge on green, then the user's visual verdict. Check H1-H4, the pencil, and the hats under the raised noren.
- **security, 2026-10-01:** Security pass. No deps/lockfile change, gitleaks clean, no network/innerHTML/eval (per-prop GLB fetch removed), role lookups guarded by hasOwn, no CSP/.github/ci-cd change. risk-check hit (clip board prop) is a false positive. See handoffs/09-security.md.
- **orchestrator, 2026-10-01:** User visual verdict (2026-10-01): looks good. security pass, PR 118 open; merge on green.
