# Handoff: 09 qa specify

```json
{
  "ticket": "den-scene-v1/09-role-headgear-assets",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed on feat/headgear09 at b8895bd: apps/ui/src/scene/headgear.test.mjs, 105 tests, all red because headgear.mjs and ROLE_PLACEMENT do not exist.",
  "artifacts": ["apps/ui/src/scene/headgear.test.mjs"],
  "decisions": [
    "Interface pinned in the test header: new pure headgear.mjs exporting ROLES, headgearSpec/propSpec/scarfSpec(role, {theme, lod}) and materialProps(token). A part is {name, kind, params, position, rotation?, scale?, material, color}; params use the three.js constructor argument names.",
    "Placement goes in ROLE_PLACEMENT in apps/ui/src/assets/panda-contract.mjs beside PROP_ASSETS (designer spec wording), not prop-placement.mjs (that module only measures glbs; the ticket's prop-placement wording is glb-era). Shape: ROLE_PLACEMENT[role] = {headgear: {socket: 'hat'}, prop: {socket}}.",
    "Triangle counts and bounding boxes are measured with real three geometries built from the part params, not recomputed by formula.",
    "HEAD_WIDTH = 1.3, measured from head-dominant vertices of panda.glb (x -0.67..0.66), so the 1.6x limit is 2.08 wide."
  ],
  "failures": [],
  "pending": [
    {"item": "Make headgear.test.mjs pass: create apps/ui/src/scene/headgear.mjs, add ROLE_PLACEMENT, wire Den.jsx (spec parts -> meshes by socket name via createAssetCache, scarf on body, live theme tint)", "owner": "developer"},
    {"item": "Confirm the debugger's station. banquet-layout stationOf('debugger') currently returns 'cubs'; the tests expect steamers hue for the debugger scarf (ticket comment 2026-10-01), so headgear.mjs needs its own role -> station map or banquet-layout needs a debugger entry", "owner": "orchestrator"},
    {"item": "Critique rounds and the user's verdict", "owner": "designer"}
  ]
}
```

## Criterion-to-test map (all in `apps/ui/src/scene/headgear.test.mjs`)

| Criterion | Tests |
|---|---|
| Each of 9 roles has headgear, a prop and a placement entry (designer test 1; the ticket's "glb" is superseded by the procedural rescope) | "the module names exactly the nine roles"; per role: "headgear and prop specs are non-empty lists of well-formed parts", "the headgear is a X and the prop is a Y, by part name", "ROLE_PLACEMENT puts the headgear on the hat socket and the prop on <paw>"; "ROLE_PLACEMENT has an entry for the nine roles and no others" |
| Scarf colour from the station hue (test 2), live on theme swap | per role and theme: "every scarf part is station-tinted with the <station> hue", "every station-tinted part ... wears the hue; neutrals never do"; toque band, cap and beret: "has a station-tinted part"; "a theme swap changes the scarf hue and leaves every neutral part's colour alone"; "the theme defaults to light" |
| Scout carries no lantern (test 3) | "scout: the prop is a magnifier (ring and handle) and nothing lantern-like" |
| Per-panda headgear + prop + scarf <= 400 tris at crowd LOD (test 4) | per role: "at most 400 triangles at crowd LOD", "crowd LOD stays within the segment caps" |
| Panda fur never tinted; soft-matte; unknown role safe (test 5) | "every part uses a station or neutral token, never a fur material"; "materials are soft-matte: roughness >= 0.8, metalness 0; glass is see-through"; "an unknown role gets no headgear and no prop, a neutral scarf, and never throws" |
| Reads at Level 1 (test 6) | per role: "headgear stays within 1.6 x the head width and rides on the head"; "the douli is wider than the other hats and the toque is the tallest" |
| Developer prop is the npm test tablet (user verdict 2026-09-30) | "developer: the prop is the npm test tablet, a slab with a screen plane" |
| Attach by socket name, shared asset cache, stationHue only, pure descriptors | wiring tests reading Den.jsx and headgear.mjs source |
| Designer critique with no high findings, then the user's verdict | human-verified (visual critique at the default camera; user verdict) |
| Silhouette alone separates all 9 roles; contrast of tinted parts >= 3:1 vs fur | human-verified in the designer critique round (only douli-widest and toque-tallest are automated). Architect's pencil fallback is not tested |
| Reduced motion: rigid on hat, no extra wobble | human-verified (render behaviour; no node seam) |
| Panda fur is never tinted (scene level) | tested at the spec level only (no fur material token exists); the Den.jsx render is human-verified |

## Red status

`node --test apps/ui/src/scene/headgear.test.mjs`: 105 tests, 0 pass, 105 fail. 93 fail with ERR_MODULE_NOT_FOUND for `headgear.mjs`, 9 fail on a missing `ROLE_PLACEMENT` entry, the rest on a missing source file or assertion on absent exports, none on syntax, import-name or setup errors. The panda-contract import is a namespace import, so a missing export fails single tests, not the file.

## Notes for the developer

- Part names are `<item>:<piece>`; item names are toque, spectacles, headphones, goggles, headlamp, douli, cap, beret (headgear) and ladle, menu, slips, tablet, magnifier, chopsticks, teacup, seal, plate (props). A `dumpling` or a `pencil` part is allowed but not required.
- The two arguments after the role are optional: theme defaults to light, `lod` to crowd. An unknown theme must not throw.
- Tests keep the descriptors pure: headgear.mjs must not import three, and must not contain station hue literals (use `stationHue`).
