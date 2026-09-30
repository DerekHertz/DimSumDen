# 02: Station hues from design tokens

**Type:** feature

**Priority:** P1

**Blocked by:** None

**Status:** ready-for-agent

**Design refs:** `docs/design/den-map.md` (coordinates, constants, checks) and `docs/design/2026-09-29-scene-decisions.md` (the why), on branch `design/scene-decisions-0929` until it merges. Target frame: "Level 1 · Den (target)" on the Zoom levels page of the zoom frames canvas (https://claude.ai/artifact/JsxZ5Vj7DxJQbekA2Ehoot). Design system: https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j (Scene, Glossary, Panda roles).

## What to build

Replace the hard-coded `HUE` map in `Market.jsx` (steamers `#e0a458`, front-of-house `#d9707e`, tea `#6fae7a`, pantry `#5f8fbf`) with the `station-*` tokens the design system defines. Pass is wisteria, Steamers porcelain blue, Tea jade, Pantry bamboo green, and Front of House azure.

- Read the values from the app's existing token source (the same place the UI already reads `qi`, `lantern` and so on). If there isn't a JS-side token map yet, add one small module that exports the station hues for light and dark, with the values copied from the design system's `tokens.json`, plus a test that pins them.
- Anything that picks a colour by station goes through this module. That includes stall trim now, and scarves (09), plate rims (04) and sidebar pills (07) later.
- No other visual change.

**Files:** `apps/ui/src/scene/Market.jsx`, a new or existing token module, tests.

## Acceptance criteria

- [ ] `Market.jsx` contains no hex station hue (grep test)
- [ ] Every station maps to the `station-*` token value for the active theme (unit test, both themes)
- [ ] Switching theme updates stall trim colour without reload (if theme switching already exists)

## Comments

- **Created (designer, 2026-09-30):** Filed from the 09-29/30 design session; the user approved every decision in this ticket.
