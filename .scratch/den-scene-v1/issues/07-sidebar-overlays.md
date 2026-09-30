# 07: Sidebar and scene overlays re-skin

**Type:** feature

**Priority:** P1

**Blocked by:** 05

**Status:** ready-for-agent

**Design refs:** `docs/design/den-map.md` (coordinates, constants, checks) and `docs/design/2026-09-29-scene-decisions.md` (the why), on branch `design/scene-decisions-0929` until it merges. Target frame: "Level 1 · Den (target)" on the Zoom levels page of the zoom frames canvas (https://claude.ai/artifact/JsxZ5Vj7DxJQbekA2Ehoot). Design system: https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j (Scene, Glossary, Panda roles).

## What to build

Rebuild the right sidebar and the three scene overlays from the components the user marked as keepers in the old Level 1 frame. Match "Level 1 · Den (target)" on the zoom frames canvas.

## Sidebar (400px, `surface-200`), top to bottom

1. **Header:** "Dim Sum Den" in the display face, and a Live dot with the word "Live" in `qi`.
2. **Needs you:** the ApprovalCard. It has a `lantern-fill` top edge, and a panda portrait in a `lantern` ring. The eyebrow reads `Station · role · ticket`, the title is "<id> wants <action>", and a `code` preview well follows. Below are Approve (primary, key hint `a`) and Deny (key hint `d`), then one row per other waiting request, each with a relative time. Keys work as ApprovalCard specifies: `a`, `d`, `m`, `j`/`k`.
3. **Stations:** one pill per open station, in its hue, with its glyph, name and panda count, and "· waiting" in `lantern` when one waits. Then dashed "coming online" pills for dormant stations: Cubs shows "N asleep"; Drum and Library show "coming online". Clicking a pill zooms to that station.
4. **Queue:** "Queue", then "N ready · next 8 on the susan", then ticket rows with a `P0`–`P3` chip and title.

Remove the plan usage meter from the sidebar; it's on the Tally now (05).

## Overlays on the scene

- **Bottom-left, zoom switcher:** 1 · Den, 2 · Station, 3 · Panda, 4 · Workspace. The current level is in `qi`. Plus + and − buttons with `aria-label`s.
- **Bottom-centre, intent bar:** autonomy toggle (AutonomyControl compact), input with placeholder "Give the den an intent…", a `Ctrl K` hint and Send, with a "Current intent" pill above.
- **Bottom-right, timeline:** Live and the time, a scrub track with event dots, and "Drag back to replay the den's history".

**Files:** the sidebar/panel components in `apps/ui/src/` (find them with `rg "Plan usage"`), the chip or overlay layer, tests.

## Acceptance criteria

- [ ] Sidebar order: header, Needs you, Stations, Queue; no usage meter (DOM test)
- [ ] Approve/Deny respond to `a`/`d` when the card has focus; key hints are visible
- [ ] A station pill shows "· waiting" when any of its pandas is `waiting_on_user`
- [ ] Dormant stations render as dashed pills with "coming online" (Cubs: "N asleep")
- [ ] Zoom switcher labels are exactly: 1 · Den, 2 · Station, 3 · Panda, 4 · Workspace
- [ ] Intent placeholder is "Give the den an intent…"
- [ ] All controls are keyboard-reachable with a visible 2px focus ring; axe finds no serious issues
- [ ] Designer review pass at desktop and mobile widths, light and dark

## Comments

- **Created (designer, 2026-09-30):** Filed from the 09-29/30 design session; the user approved every decision in this ticket.
