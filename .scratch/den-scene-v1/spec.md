# Den scene v1

Build the Level 1 den the user signed off on in the 2026-09-29/30 design session: a horseshoe market around Bao and a two-tier lazy susan, pagoda kiosks in token hues, an abacus Tally that carries plan usage, a cubs hamper, the new sidebar, Dim Sum Den words in every visible string, and headgear + scarf looks for every role.

**Design refs:** `docs/design/den-map.md` (coordinates, constants, checks) and `docs/design/2026-09-29-scene-decisions.md` (the why), on branch `design/scene-decisions-0929` until it merges. Target frame: "Level 1 · Den (target)" on the Zoom levels page of the zoom frames canvas (https://claude.ai/artifact/JsxZ5Vj7DxJQbekA2Ehoot). Design system: https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j (Scene, Glossary, Panda roles).

## Decisions (user-approved)

| Topic | Decision |
|---|---|
| Layout | Horseshoe: back kiosks inward, front kiosks outward, all turned toward the table (max 30°) |
| Stalls | Pagoda kiosk: ink-tile roof, station-hue trim, noren sign, one paper lantern |
| Hues | `station-*` design tokens; delete the `HUE` map in `Market.jsx` |
| Looks | Headgear per role (silhouette) + scarf in station hue |
| Lazy susan | Two tiers: ready queue (max 8 + overflow stack) below, claimed work above |
| Tally | Wooden abacus; 5 h and Week rods carry plan usage (replaces the stone stele) |
| Cubs | Lidded hamper with a Pass-hue blanket |
| Sidebar | Needs you, Stations, Queue; no usage meter |
| Words | Den words in UI; code identifiers unchanged (design system Glossary, `CONTEXT.md` "UI names") |

## Tickets

| # | Ticket | Blocked by | Priority |
|---|---|---|---|
| 01 | Horseshoe layout, pandas stay at their station | — | P1 |
| 02 | Station hues from design tokens | — | P1 |
| 03 | Pagoda kiosks with noren and paper lantern | 01, 02 | P1 |
| 04 | Two-tier lazy susan with overflow stack | 03 | P1 |
| 05 | Tally abacus with plan-usage rods | 01 | P1 |
| 06 | Cubs hamper | 01 | P2 |
| 07 | Sidebar and scene overlays re-skin | 05 | P1 |
| 08 | Dim Sum Den words in every visible string | 07 | P2 |
| 09 | Headgear and scarf assets for every role | — | P2 |

01, 02 and 09 share no files and can run in parallel. 05 and 06 can run alongside 03.

## Out of scope

Levels 2–4 re-skin (a later design session), planned roles (Drum, Library, Painter), rigging and character animation.
