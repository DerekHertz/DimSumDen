# 09: Headgear and scarf assets for every role

**Type:** asset

**Priority:** P2

**Blocked by:** None

**Status:** ready-for-agent

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
