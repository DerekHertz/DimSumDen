# 05: Tally abacus with plan-usage rods

**Type:** feature

**Priority:** P1

**Blocked by:** 01

**Status:** ready-for-agent

**Design refs:** `docs/design/den-map.md` (coordinates, constants, checks) and `docs/design/2026-09-29-scene-decisions.md` (the why), on branch `design/scene-decisions-0929` until it merges. Target frame: "Level 1 · Den (target)" on the Zoom levels page of the zoom frames canvas (https://claude.ai/artifact/JsxZ5Vj7DxJQbekA2Ehoot). Design system: https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j (Scene, Glossary, Panda roles).

## What to build

Replace the stone stele with a wooden suanpan abacus that also carries plan usage. This removes the need for a usage meter in the sidebar (07 removes it).

- Frame about 1.1 wide × 1.4 tall on short legs, in wood with dark rods and a warm paper backing. It stands at `TALLY` (set in 01) and faces the camera.
- Five rods, top to bottom, each with a sans label at its left end: **5 h**, **Week**, **Served**, **Tokens**, **Spills**. The heading "Tally" is in the display face.
- Ten beads per rod, one bead per tenth of the rod's scale. Usage rods scale 0–100%. For Served, Tokens and Spills, reuse the scale the tally face view-model already uses; if it has none, use "this 5-hour window" and state the scale in the dashboard.
- Counted beads slide right in the rod's colour: `qi` for 5 h, Week and Served, `station-steamers` for Tokens, `alarm` for Spills. Uncounted beads stay wood.
- The usage rods get an 80% mark on the frame in `lantern-fill`. Past 95%, their counted beads turn `alarm`.
- Usage comes from the same source as today's sidebar meter (`usage.jsonl` through the bridge).
- Accessibility: the `Tally` pill above the frame opens the dashboard on click or Enter ("Tally: open the dashboard"). Each usage rod is exposed as `role="meter"` with an `aria-label` like "5-hour window 79%", using the chip layer or a visually hidden DOM twin. Exact values live in the labels and the dashboard.
- Beads slide over `dur-base` only when a count changes. With reduced motion they jump.
- The code can keep the `Stele`/`tally-stele` names; rename is optional. Remove the stone geometry.

**Files:** `apps/ui/src/scene/TallyFace.jsx`, `tally-face.mjs`, `Market.jsx` (or wherever the stele mounts), tests (`tally-stele.test.mjs`, `tally-face.test.mjs`).

## Acceptance criteria

- [ ] Five labelled rods in order: 5 h, Week, Served, Tokens, Spills
- [ ] Counted-bead count = round(value / scale × 10) per rod (unit test with fixtures, including 0 and 100%)
- [ ] Usage rods at 79% show 8 counted beads and an 80% mark; at 96% the counted beads use `alarm`
- [ ] The 5 h and Week rods read the same values as the current usage source
- [ ] Each usage rod has `role="meter"` with the exact % in its accessible name
- [ ] Click and Enter on the Tally open the dashboard without page scroll
- [ ] No stone stele geometry remains; user visual verdict

## Comments

- **Created (designer, 2026-09-30):** Filed from the 09-29/30 design session; the user approved every decision in this ticket.
