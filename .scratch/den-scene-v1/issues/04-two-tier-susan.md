# 04: Two-tier lazy susan with overflow stack

**Type:** feature

**Priority:** P1

**Blocked by:** 03

**Status:** ready-for-agent

**Design refs:** `docs/design/den-map.md` (coordinates, constants, checks) and `docs/design/2026-09-29-scene-decisions.md` (the why), on branch `design/scene-decisions-0929` until it merges. Target frame: "Level 1 · Den (target)" on the Zoom levels page of the zoom frames canvas (https://claude.ai/artifact/JsxZ5Vj7DxJQbekA2Ehoot). Design system: https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j (Scene, Glossary, Panda roles).

## What to build

Turn the susan into two tiers so it shows the queue and the work at once, and replace the "+N more in queue" corner caption.

| Tier | Holds | Layout |
|---|---|---|
| Bottom (on the table, radius ≈ 0.95) | One steamer basket per `ready-for-agent` ticket, max 8 | 45° apart; the next ticket faces the camera |
| Top (raised 0.25, radius ≈ 0.5) | One plated dumpling per claimed ticket | evenly spaced |
| Overflow | Tickets past 8 | A basket stack on the table's right edge with a `+N` pill (chip layer, `surface-200`) |

- Basket lid tag: shade by priority, darkest for P0. The chip shows `P0`–`P3`, so priority never relies on shade alone.
- Plate rim: the claiming panda's station hue (from 02).
- On claim, the bottom tier turns one step over `dur-slow` and the basket rises to the top tier as a plate. On resolve, the plate leaves toward the Pass. With reduced motion, jump to the end state.
- Remove the "+N more in queue" caption.

**Files:** `apps/ui/src/scene/handoffs.mjs` (`susanLayout`, `turnAngle`), `Market.jsx`, the queue caption component, tests.

## Acceptance criteria

- [ ] Bottom-tier basket count = min(ready, 8) (layout test)
- [ ] Overflow pill shows ready − 8 when > 0 and is absent otherwise
- [ ] Top-tier plate count = claimed tickets; each plate rim = claimer's station hue
- [ ] The next-up basket's angle faces the camera (+z) at rest
- [ ] Reduced motion: no tween; the state jumps (test with the reduced-motion flag)
- [ ] The corner queue caption no longer renders

## Comments

- **Created (designer, 2026-09-30):** Filed from the 09-29/30 design session; the user approved every decision in this ticket.
