# Handoff: 09 designer spec

```json
{
  "ticket": "den-scene-v1/09-role-headgear-assets",
  "cell": "designer",
  "mode": "spec",
  "current_step": "Procedural headgear/prop UI spec written; summary posted as a ticket comment. Full spec below.",
  "artifacts": ["/tmp/09-designer-spec.md"],
  "decisions": ["Pure headgear.mjs part descriptors in socket-local frame, cached via createAssetCache", "Station hue only via stationHue(); neutrals cream/ink/wood/glass", "debugger mapped to steamers pending confirmation", "Developer prop is the npm test tablet per user verdict 2026-09-30"],
  "failures": ["Design system artifact HBXgYhAzu6YmekpW71WM7j read: not found / not shared; used repo tokens (station-hues.mjs) instead"],
  "pending": [
    {"item": "Turn spec tests 1-6 into failing tests", "owner": "qa"},
    {"item": "Confirm debugger station (steamers assumed)", "owner": "orchestrator"}
  ]
}
```

See the spec section that follows (same content as the ticket comment, expanded).

# 09 designer spec: procedural role headgear and props

Supersedes the glb wording in the ticket body (user rescope, 2026-10-01). Low-poly first; polish is a later pass.

## Layout and module shape

- New pure module `apps/ui/src/scene/headgear.mjs` (no three import in the geometry descriptors, like `stall-roof.mjs`): `headgearSpec(role)` and `propSpec(role)` return a list of parts `{kind: lathe|torus|cylinder|box|sphere, params, position, rotation, material: "station"|"cream"|"ink"|"glass"|"wood"}` in the socket's local frame. A thin builder turns parts into meshes; the builder is cached per role via `createAssetCache` (shared prop cache).
- Attach by socket name only (`hat`, `paw_L`, `paw_R` from `panda-contract.mjs`). Headgear on `hat`; prop on the role's paw. Add a placement entry per role (role -> {headgear, prop, socket}) beside `PROP_ASSETS`.
- One shared scarf part (torus segment ring + two short box tails, front-left) on the body below `head`, every role.

| Role | Station | Headgear (silhouette cue) | Prop, socket |
|---|---|---|---|
| orchestrator | pass | toque: tall lathe puff + station band | ladle, paw_R |
| product | pass | round spectacles (2 torus + bridge) | open menu (2 boxes, V), paw_L |
| architect | pass | round spectacles + pencil behind ear (fallback if not distinct from product) | order slips on clip, paw_L |
| developer | steamers | headphones (torus arc + 2 cylinders) | npm test tablet (bevelled slab + screen plane, red/green lines), paw_L; dumpling optional |
| scout | steamers | goggles on forehead (2 cylinders + strap torus) | magnifier, paw_R; no lantern |
| debugger | steamers (open question) | headlamp (strap torus + cylinder lamp) | chopsticks, paw_R |
| qa | tea | straw douli: wide flat lathe cone | teacup, paw_R |
| security | pantry | cap: half sphere + box brim, station-tinted | pantry seal (cylinder disc), paw_R |
| designer | front-of-house | beret: squashed sphere, station-tinted, tilted 15 deg | garnished plate, paw_L |

## Tokens

- Station colour: `stationHue(station, theme)` from `station-hues.mjs` only (keys pass, steamers, tea, pantry, front-of-house). Scarf, toque band, cap and beret take it; it updates live on theme change.
- Non-hue parts use fixed neutral materials: cream (toque, menu, slips, plate), ink (spectacle/goggle frames, chopsticks), wood (ladle handle, straw douli in a warm straw), glass (lenses, low opacity). All MeshStandardMaterial, roughness >= 0.8, metalness 0 (soft-matte plush).
- Panda fur is never tinted.

## States

- Theme light/dark: hue swaps with the theme; neutrals unchanged.
- Loading: no async load (procedural); geometry ready on first frame. Missing/unknown role: no headgear, no prop, scarf in the neutral cream; never throw.
- Reduced motion: headgear is rigid on `hat` and inherits idle head motion only; no extra wobble or spin. The prop loop follows existing clip rules.
- Crowd LOD: same parts at lower segment counts. Budget per panda, headgear + prop + scarf <= 400 tris at crowd LOD (lathe <= 8 radial segs, torus <= 8x6, cylinder <= 8).

## Interactions and copy

None new; headgear is decorative. Station labels already carry the name. Hover/click behaviour unchanged.

## Accessibility

- Decorative 3D: no new accessible names. Role stays exposed through existing station labels (`station-label-sronly`).
- Role must never rely on hue alone: silhouette distinguishes all 9 roles (that is the critique test).
- Station hue on scarf vs fur: tinted parts must contrast with black/white fur, >= 3:1 against both #1a1a1a and #f2efe8 in each theme where possible; flag any that fail in critique.

## Tests for qa

1. Every role in the 9-role table returns non-empty headgear and prop specs and a placement entry with a valid socket name.
2. Scarf (and toque band, cap, beret) colour equals `stationHue(stationOf(role), theme)` for both themes.
3. Scout prop contains no lantern part.
4. Triangle count of headgear + prop + scarf at crowd LOD <= 400 for every role.
5. No part uses a fur material; unknown role returns empty specs without throwing.
6. Headgear bounding box at the `hat` socket stays within 1.6x the head width (reads at Level 1 without hiding neighbours).

## Critique (later round)

Designer measures silhouette at the default camera: each role distinguishable in a front and three-quarter screenshot at Level 1.
