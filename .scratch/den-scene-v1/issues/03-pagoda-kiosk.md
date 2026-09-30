# 03: Pagoda kiosks with noren sign and paper lantern

**Type:** feature

**Priority:** P1

**Blocked by:** 01, 02

**Status:** ready-for-agent

**Design refs:** `docs/design/den-map.md` (coordinates, constants, checks) and `docs/design/2026-09-29-scene-decisions.md` (the why), on branch `design/scene-decisions-0929` until it merges. Target frame: "Level 1 · Den (target)" on the Zoom levels page of the zoom frames canvas (https://claude.ai/artifact/JsxZ5Vj7DxJQbekA2Ehoot). Design system: https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j (Scene, Glossary, Panda roles).

## What to build

Rebuild the stall roof and dressing as a pagoda kiosk. One build serves all four stations; only the hue, sign text and pandas change.

| Part | Look | Colour |
|---|---|---|
| Roof | Upturned eaves (corners lift), tiled look from low-poly facets; replaces the flat pyramid | `panda-ink` |
| Eave trim | A thin band along the eave line | station hue |
| Posts, counter band | — | station hue |
| Counter body | Wood | existing `WOOD` |
| Noren curtain | 3–5 cloth panels hanging under the front eave; station name on it in the display face (Long Cang) | station hue; text `surface-200` |
| Lantern | One rice-paper lantern at the front eave corner nearest the table | unlit `surface-200`; lit `lantern-fill` (with emissive) |

- The lantern is lit only when at least one panda at that station is `waiting_on_user`. Reuse `lanternState` in `handoffs.mjs`.
- Delete the brown sphere lanterns.
- The noren sign replaces the floating rice-paper label as the visible name. Keep the chip-layer anchor and its `aria-label` for screen readers and badges.
- The roof keeps today's height budget (`EAVE_Y`, `RISE`, `FRONT_ROOF`) so pandas and chips stay visible under it.
- No `lantern` yellow or `alarm` red anywhere on a kiosk except the lit lantern.

**Files:** `apps/ui/src/scene/stall-roof.mjs`, `Market.jsx`, `station-labels.mjs`, tests.

## Acceptance criteria

- [ ] Roof ring has upturned corners: corner vertices sit higher than mid-edge vertices by ≥ `UPTURN` (geometry test)
- [ ] Each kiosk has exactly one lantern mesh; no sphere lanterns remain
- [ ] With no waiting panda, no lantern uses `lantern-fill`; with one waiting panda at Tea, exactly Tea's lantern is lit (state test)
- [ ] Noren text equals the station name for each kiosk
- [ ] Designer review pass against the target frame, light and dark

## Comments

- **Created (designer, 2026-09-30):** Filed from the 09-29/30 design session; the user approved every decision in this ticket.
