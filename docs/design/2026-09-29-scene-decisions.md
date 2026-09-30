# Scene decisions, 2026-09-29

The user picked these in a design session. For coordinates, constants and qa checks in one page, see [den-map.md](den-map.md). The options and the composed target are in the zoom frames canvas (https://claude.ai/artifact/JsxZ5Vj7DxJQbekA2Ehoot): the options are on the "Design session 09-29" page, and the target is the "Level 1 · Den (target)" board on the "Zoom levels" page. Code references are to `apps/ui/src/scene/` on `main` at `f6be2f4`.

| Topic | Picked | Rejected |
|---|---|---|
| Scene layout | A · Horseshoe market | B · Market lane, C · Banquet ring |
| Stalls | B · Pagoda kiosk | A · Night-market cart, C · Bamboo lean-to |
| Agent looks | C · Headgear + scarf | A · Hat + prop, B · Apron + prop |
| Lazy susan | C · Two tiers | A · Steamer queue, B · Plated slips |
| Tally and Cubs | Abacus Tally (2026-09-30, replaced B's stone stele) + B's hamper | A · Specials easel, B · Stone stele, the hanging-slips version of C |
| Stall hues | Design system `station-*` tokens | The shipped `HUE` map in `Market.jsx` |
| Plan usage | Two abacus rods (5 h, Week); first picked as B · carved stele gauges | A · Carved rings, C · Incense sticks |
| Planned cell homes | As drawn in the character sheets | A fifth "Back Room" kiosk |

## 1. Scene layout: Horseshoe market

- Bao sits behind the lazy susan table at the center. The four stalls sit on one arc around the table and face it: Steamers at the back left, Front of House at the back right, Tea at the front left, Pantry at the front right.
- Back stalls sit closer to the center line and higher up; front stalls sit at the outer edges. **No stall hides another stall's counter or sign from the default camera.** Today the front roofs cover the back stalls' counters (`STALLS` in `banquet-layout.mjs`).
- The Cubs hamper sits front left of the table and the Tally stele front right, both in front of the table line.
- Cells stay at their stall. The Pass cells stay on Bao: orchestrator on the crown, product and architect on the shoulders. Cells don't roam the open grass. A cell leaves its stall only to carry a handoff along the arc.

Verify: at the default camera, every stall's sign text and counter top are fully visible, and no panda stands on open grass unless it is mid-handoff.

## 2. Stalls: Pagoda kiosk

One build for all four stalls; only the hue, the sign and the cells change.

- Roof: upturned eaves in `panda-ink` tiles, with a trim line in the station hue along the eave. This replaces the flat black pyramid.
- Posts and counter band are in the station hue. The counter body is wood.
- A noren curtain in the station hue hangs under the eave. The stall name is written on it in `display` (Long Cang). It replaces the floating rice-paper label as the stall's name. Keep the `aria-label` on the chip layer.
- One rice-paper lantern hangs from a front eave corner. It is pale (`surface-200`) when unlit and `lantern-fill` when any cell at that stall is `waiting_on_user`. Delete the brown sphere lanterns.
- No `lantern` yellow or `alarm` red anywhere else on a stall.

Verify: a stall with a waiting cell has exactly one lit lantern and the others have none; with no waiting cells, no lantern in the scene is yellow.

## 3. Agent looks: Headgear + scarf

- **Silhouette carries the type; the scarf carries the station.** Every cell wears a scarf in its station hue. Headgear is unique per type and big enough to read at Level 1 zoom.
- Headgear and prop per type (held props stay as documented in `cell-types.md`):

| Cell type | Station | Headgear | Prop |
|---|---|---|---|
| orchestrator | Pass | Chef's toque | Ladle |
| product | Pass | Round spectacles | Open menu |
| architect | Pass | Round spectacles | Order slips on a clip |
| developer | Steamers | Headphones | Dumpling |
| scout | Steamers | Goggles | Magnifier (replaces the lantern, so no lantern shape is left on a cell) |
| qa | Tea | Straw douli hat | Teacup |
| security | Pantry | Cap | Pantry seal |
| designer | Front of House | Beret | Garnished plate |

- product and architect share spectacles and are told apart by their prop. If they don't read apart in the build, give architect a pencil behind the ear. That's a design review call, not a blocker.
- Headgear is soft-matte and plush, like the other props. Panda fur is never tinted.

Verify: in a Level 1 screenshot, each of the eight types can be named from its headgear alone, and the station can be named from its scarf alone.

## 4. Lazy susan: Two tiers

- **Bottom tier: the ready queue.** One steamer basket per `ready-for-agent` ticket, up to 8. When there are more than 8, the rest show as a short basket stack beside the table with a count pill (`+23`). This replaces the "+23 more in queue" caption in the corner.
- The lid tag's shade shows priority, darkest for P0. Priority is never shown by hue alone: the tag also carries the P number in the chip.
- **Top tier: in progress.** One plated dumpling per ticket that a cell has claimed, rimmed in the claiming cell's station hue.
- On claim, the bottom tier turns one step (`dur-slow`), and the claimed basket moves up to the top tier as a plate. On resolve, the plate leaves along the arc toward the Pass. Reduced motion jumps straight to the end state.

Verify: bottom-tier basket count = min(ready, 8); overflow pill = ready − 8 when that's above 0; top-tier plate count = claimed tickets.

## 5. Tally and Cubs: Stone stele and hamper

- Tally is the shipped Stele component (`stone`, `stone-deep`), with its bars cut into the face. It keeps its click-to-open-charts behaviour. The dark tablet screen goes.
- The Cubs basket is a lidded bamboo hamper with a `station-pass` blanket. One sleeping cub per idle stem cell, with a `zzz` above them.

## 6. Stall hues come from design tokens

Replace the `HUE` map in `Market.jsx` (steamers `#e0a458`, front-of-house `#d9707e`, tea `#6fae7a`, pantry `#5f8fbf`) with the `station-*` tokens: steamers porcelain blue, front-of-house azure, tea jade, pantry bamboo green, and the Pass wisteria for Bao's crown props. The design system is the single source of the hues.

## 7. Tally is an abacus (changed 2026-09-30)

The user swapped the stone stele for a wooden suanpan abacus. It has five rods: 5 h and Week for plan usage, with an 80% mark, then Served, Tokens and Spills. Plan usage leaves the sidebar. The full spec is in the design system's Tally component and in [den-map.md](den-map.md). This replaces §5's stele; the `Stele` code name stays until the Tally ticket renames it.

Verify: the 5 h and Week rods match `usage.jsonl`, and the sidebar has no usage meter.

## 8. Sidebar and overlays

These are the components the user marked in the old Level 1 frame, rebuilt for the den ("Level 1 · Den (target)").

- Sidebar, top to bottom: the title in `display` and a Live dot; **Needs you** (approval card with a portrait in a `lantern` ring, a station · type · ticket eyebrow, a `code` preview well, and Approve `a` / Deny `d` with key hints, then the other waiting rows); **Stations** (hue pills with counts and waiting state, plus dashed "coming online" pills for Cubs, Drum and Library); **Queue** (ready count, "next 8 on the susan").
- Over the scene: the zoom switcher bottom-left (1 · Den, 2 · Stall, 3 · Cell, 4 · Workspace), the intent bar bottom-center, and the replay timeline bottom-right.

The user also marked the Level 2 right panel, the Level 3 live feed and cell card, and all of Level 4 as keepers. Those frames still use organ names and need the same den re-skin in a later session. One open question from the user's comment: whether the Level 3 "18 passed" terminal chip fits the den. The designer's answer is yes, if it's styled as qa's tasting note.

## 9. Character roster

The character sheets are on the "Cell roster" board. These additions are beyond §3:

| Cell type | Status | Home | Headgear | Prop |
|---|---|---|---|---|
| debugger | Genome, not modeled | Steamers | Headlamp | Chopsticks lifting a stray hair |
| release manager (the Drummer) | Planned | Pass, on Bao | Hachimaki headband | Festival drum |
| knowledge keeper (the Librarian) | Planned | Scroll shelf beside the stele | Scholar's futou | Bamboo slips |
| docs writer (the Painter) | Planned | Front of House | Bandana | Ink brush and paper |
| stem cub | Planned | Cubs hamper | Nightcap | None |

## Follow-up tickets (for the orchestrator to file)

1. Re-lay the stalls into the horseshoe and stop cells roaming (§1). Touches `banquet-layout.mjs`, `roam.mjs`, `station-labels.mjs`.
2. Pagoda kiosk roof, noren sign, and a paper lantern, using token hues (§2, §6). Touches `stall-roof.mjs`, `Market.jsx`.
3. Two-tier susan with an overflow stack (§4). Touches `handoffs.mjs` (`susanLayout`), `Market.jsx`, and the queue caption.
4. Tally as the Stele, Cubs as a hamper (§5).
5. An asset ticket for headgear and scarf meshes for all eight types (§3), plus the debugger (§9), with designer `asset-critique` rounds.
6. Rebuild the Tally as an abacus with usage rods, and remove the sidebar usage meter (§5, §7). Touches `TallyFace.jsx`, `tally-face.mjs`, `Market.jsx`.
7. Sidebar re-skin: Needs you, Stations, Queue, and the scene overlays (§8).
