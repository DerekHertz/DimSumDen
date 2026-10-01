# 06: Cubs hamper

**Type:** feature

**Priority:** P2

**Blocked by:** 01

**Status:** ready-for-agent

**Design refs:** `docs/design/den-map.md` (coordinates, constants, checks) and `docs/design/2026-09-29-scene-decisions.md` (the why), on branch `design/scene-decisions-0929` until it merges. Target frame: "Level 1 · Den (target)" on the Zoom levels page of the zoom frames canvas (https://claude.ai/artifact/JsxZ5Vj7DxJQbekA2Ehoot). Design system: https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j (Scene, Glossary, Panda roles).

## What to build

Replace the open cub basket with a lidded bamboo hamper.

- A woven bamboo box at `CUB_BASKET` (set in 01), with its lid propped open on the back edge and a `station-pass` blanket across the front.
- One sleeping cub per idle stem panda (today's cub count logic), side by side, with a `zzz` chip above them.
- Label "Cubs" stays on the chip layer.

**Files:** where the cub basket mounts today (`Market.jsx`), `banquet-layout.mjs` if the radius changes, tests.

## Acceptance criteria

- [ ] Hamper renders at `CUB_BASKET`; the cub count equals idle stem pandas (test)
- [ ] Blanket colour = `station-pass` token
- [ ] Hamper doesn't overlap the table or the Tally from the default camera

## Comments

- **Created (designer, 2026-09-30):** Filed from the 09-29/30 design session; the user approved every decision in this ticket.
- **orchestrator, 2026-09-30:** Design sweep (designer, user-approved 2026-09-30): Scope added: low-poly first (box with a hinged lid). Cubs wear a nightcap.
