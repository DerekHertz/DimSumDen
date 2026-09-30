# 01: Horseshoe layout, pandas stay at their station

**Type:** feature

**Priority:** P1

**Blocked by:** None

**Status:** ready-for-agent

**Design refs:** `docs/design/den-map.md` (coordinates, constants, checks) and `docs/design/2026-09-29-scene-decisions.md` (the why), on branch `design/scene-decisions-0929` until it merges. Target frame: "Level 1 · Den (target)" on the Zoom levels page of the zoom frames canvas (https://claude.ai/artifact/JsxZ5Vj7DxJQbekA2Ehoot). Design system: https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j (Scene, Glossary, Panda roles).

## What to build

Move the four kiosks, the cubs basket and the Tally into the horseshoe, turn each kiosk toward the table, and stop free roaming. After this, no kiosk hides another from the default camera, and a panda leaves its station only to carry a handoff.

## Numbers (world units; the table is the origin, +z toward the camera)

| Thing | Now (x, z) | Target (x, z) | Yaw (rad) | Constant |
|---|---|---|---|---|
| Steamers | -4.8, -1.6 | -3.0, -1.4 | +0.52 | `STALLS.steamers` (keep 0.5 platform) |
| Front of House | 4.8, -1.6 | 3.0, -1.4 | -0.52 | `STALLS["front-of-house"]` (keep platform) |
| Tea | -4.0, 2.2 | -4.9, 2.0 | +0.52 | `STALLS.tea` |
| Pantry | 4.0, 2.2 | 4.9, 2.0 | -0.52 | `STALLS.pantry` |
| Cubs basket | 0, 3.4 | -1.8, 3.0 | 0 | `CUB_BASKET` |
| Tally | 1.5, 3.4 | 1.8, 3.0 | keep the face-the-camera formula | `TALLY` |

- Kiosk yaw is `clamp(atan2(-x, -z), -0.52, 0.52)`. Export it as a function so 03 and the tests use the same rule.
- Positions may move up to ±0.3 if an acceptance check needs it. Say so in Comments if you move one.
- Bao, the table, the camera and the `PASS` perches don't change.
- Remove free roaming from `roam.mjs`. Idle pandas stay in their station slot. Handoff travel (`handoffs.mjs`) is the only movement between stations and walks the arc between kiosks, not across the open grass.
- Station labels follow their kiosks (`station-labels.mjs` reads the new centres).

**Files:** `apps/ui/src/scene/banquet-layout.mjs`, `roam.mjs`, `station-labels.mjs`, their tests; `Market.jsx` only to apply yaw.

## Acceptance criteria

- [ ] Each kiosk, the cubs basket and the Tally are at their target (x, z) within ±0.3 (test on layout exports)
- [ ] Each kiosk's yaw equals the clamp rule; |yaw| ≤ 0.52
- [ ] From the default camera, no kiosk's counter-top rectangle overlaps another kiosk's, Bao's or the table's screen-space bounds (projection test)
- [ ] An idle panda's position stays within its station slot over 60 simulated seconds (roam test)
- [ ] A handoff path from any station to another never passes within 0.3 of the table edge or crosses the open grass in front of it
- [ ] User visual verdict at the default camera

## Comments

- **Created (designer, 2026-09-30):** Filed from the 09-29/30 design session; the user approved every decision in this ticket.
