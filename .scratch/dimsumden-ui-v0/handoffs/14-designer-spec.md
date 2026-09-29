```json
{"ticket": "dimsumden-ui-v0/14", "cell": "designer", "mode": "spec", "current_step": "UI spec for direction A (Paper-cut grove) written; ready for qa specify",
 "artifacts": [".scratch/dimsumden-ui-v0/handoffs/14-designer-spec.md"],
 "decisions": ["Backdrop is one <Backdrop> group, sibling of Bao in Den.jsx, all geometry at z <= -1.5 (world units, Bao at origin)", "Colours only from existing tokens: surface-000/100/300, line, line-strong, ink-faint; no organ, qi, lantern or alarm hues", "Depth fade by stepping tokens per band, plus scene fog = surface-100", "Backdrop meshes ignore raycasts so plush click and onPointerMissed still work"],
 "failures": ["AskUserQuestion not available in this dispatch; open questions listed below", "Design system has no bamboo/jade/gold/vermilion tokens that the direction note named; spec uses neutral tokens instead"],
 "pending": [{"item": "qa specify: turn the Tests section into failing tests", "owner": "qa"}, {"item": "User answers open questions Q1-Q2 (green tint tokens, vermilion accent)", "owner": "orchestrator"}, {"item": "Design review after qa verify, then user visual verdict", "owner": "designer"}]}
```

**State**: complete for spec. No build started.

# Ticket 14 UI spec: Paper-cut grove backdrop

Context read: `apps/ui/src/scene/Den.jsx` (Bao at origin, perch anchors as fractions of Bao's bbox; grass perches reach z = 0.9 x depth), `apps/ui/src/App.jsx:48` (camera `[0, 1.2, 10]`, fov 35), design system `tokens.json`.

## Layout (world units, Bao's feet at y = 0, camera looking down -z)
A papercraft diorama of flat, flat-shaded layers, all behind Bao:

| band | z | contents | token (light / dark via theme) |
| --- | --- | --- | --- |
| ground | y = 0, z from -1.5 to -9 | one flat plane, grass line edge at z = -1.5 | `surface-000` |
| near | -2.0 to -2.5 | 5-7 bamboo stalks (hex prisms, r 0.06-0.09, h 3.5-4.5) at the left and right thirds only; leaf wedges (flat triangles, 2-3 per stalk). Side props: left a counter (box 1.4 x 0.7 x 0.4) with 2 steamer stacks (3 stacked cylinders r 0.28, h 0.12 each, lid a flat cone); right 2 hanging paper lanterns (octagonal prisms, cream, unlit) | stalks `line-strong`, leaves `line`, props `surface-300` with `line-strong` bands |
| mid | -4.5 to -5 | tea house silhouette centred behind Bao: box body 2.6 wide x 1.2 high, 3 stepped slabs for the curved eave (each 0.15 thick, widening upward then flaring), one ridge bar; plus 6-8 stalks spread wider | body `surface-300`, roof `line-strong`, stalks `line` |
| far | -8 | 10-14 thin stalks, no leaves | `line` at `opacity-dim` or pure fog |

- Fog: `THREE.Fog` colour = `surface-100` of the active theme, near 8, far 20, so the far band melts into the page. Canvas clear colour matches `surface-100`.
- Keep-out zone: no backdrop geometry may appear in screen space inside Bao's bbox expanded by the plush scale around every perch anchor. Practical rule: the tea house roof ridge stays below y = 1.1 x Bao's height when seen from the default camera, and no stalk sits within x in [-1.6, 1.6] in the near band (it would frame shoulder and grass plushes).
- Budget: <= 3,000 triangles total; geometry merged by material into <= 6 meshes (ideally one per token); `MeshLambertMaterial` with `flatShading` or `MeshBasicMaterial`; `castShadow` and `receiveShadow` false; `frustumCulled` true. Built once in `useMemo`; no `useFrame`.

## Tokens used (all exist in the design system)
`surface-000`, `surface-100`, `surface-300`, `line`, `line-strong`, `ink-faint` (lantern cords, eave tips), `opacity-dim`. Read at runtime from the CSS custom properties (the app already exposes `--bg`, `--ink*`; add the missing ones as CSS vars rather than hard-coding hex in JSX).

Forbidden in the backdrop: `qi*`, `lantern*`, `alarm*`, every `organ-*`, every `state-*`, `panda-ink`, `panda-fur`. Lanterns are paper cream (`surface-100`/`surface-300`), never emissive, never `lantern` amber.

## States
- **Empty (no cells)**: backdrop renders the same; Bao alone in the grove.
- **Loading**: backdrop is procedural, so it renders with the first frame; it must not wait on `panda.glb` (not inside the same Suspense boundary as the loader, or render the fallback with it).
- **Error** (glb fails): backdrop still renders behind whatever error fallback shows.
- **Reduced motion**: nothing changes; the backdrop never animates, and the camera does not parallax it.
- **Light theme (bamboo grove)**: token light values; fog cream `#f8f3e8`.
- **Dark theme (lantern dusk)**: same geometry, token dark values; fog `#171b20`. No emissive or glow. Theme switch recolours materials without remounting the scene.

## Interactions and copy
- None. The backdrop is decoration: its meshes set `raycast` to a no-op so clicks pass through, and a click on the backdrop still counts as `onPointerMissed` (deselects).
- No copy, no labels, no tooltips.

## Accessibility
- Canvas is already `aria-hidden`; the backdrop adds no DOM and no focus stops.
- Chips keep >= 4.5:1 text contrast over whatever backdrop sits behind them in both themes (chips have their own `surface-200` ground; verify no chip loses its ground).
- Backdrop contrast is kept low on purpose: every backdrop colour is within the surface/line range, so plush and Bao silhouettes (`panda-ink`/`panda-fur`) stay the strongest shapes. Line vs surface-100 is ~1.3:1: fine for decoration, never used as information.
- Frame rate: no drop over 5% versus the scene without the backdrop at the default viewport.

## Tests for qa (scene-graph, per acceptance criteria)
1. A `Backdrop` group exists in the Den scene graph, rendered before/behind Bao.
2. Every backdrop mesh's world bounding box has max z <= -1.5 (behind every perch anchor, whose max z is 0.9 x Bao depth).
3. Projected with the default camera, no backdrop mesh in the near band overlaps x in [-1.6, 1.6]; tea house max y <= 1.1 x Bao bbox height.
4. Total triangle count <= 3000; mesh count <= 6; no mesh casts or receives shadows; no material is emissive.
5. Material colours equal the resolved values of the allowed tokens for the active theme; none equals a forbidden token value (check `lantern`, `lantern-fill`, `alarm`, `qi` in both themes).
6. Raycasting a backdrop mesh returns no hit; clicking empty backdrop deselects a selected plush.
7. Switching theme recolours without remount (same mesh uuids).
8. Backdrop renders when `panda.glb` fails to load.
9. No `useFrame` subscription from the backdrop (static).

## Open questions (AskUserQuestion was unavailable)
- **Q1**: The direction note promised bamboo greens, jade and gold, but the design system has no such neutral-decor tokens (the greens are `organ-immune`/`organ-liver`, which carry meaning). Spec uses neutral surface/line values, so the grove reads as a pale paper cut-out. Should I propose two new decor tokens (`decor-bamboo`, `decor-bamboo-far`, desaturated green, light and dark) to the design system? That is design-system upkeep and needs the user's approval before publish; the build can swap them in later without layout changes.
- **Q2**: Vermilion decorative accent (eave tips, lantern tassels): no token exists and it sits close to `alarm`. Recommend dropping it. Confirm.

**Next step**: orchestrator relays Q1-Q2 to the user (non-blocking: the spec builds as written), then dispatches qa specify.
**Suggested skills**: organism-protocol, tdd.
**Gotchas**: App.jsx camera and Den anchors may shift with other tickets; tests should derive keep-out bounds from Bao's bbox and the anchors, not hard-coded numbers where possible.
