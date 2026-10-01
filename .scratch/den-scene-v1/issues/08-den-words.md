# 08: Dim Sum Den words in every visible string

**Type:** feature

**Priority:** P2

**Blocked by:** 07

**Status:** ready-for-agent

**Design refs:** `docs/design/den-map.md` (coordinates, constants, checks) and `docs/design/2026-09-29-scene-decisions.md` (the why), on branch `design/scene-decisions-0929` until it merges. Target frame: "Level 1 · Den (target)" on the Zoom levels page of the zoom frames canvas (https://claude.ai/artifact/JsxZ5Vj7DxJQbekA2Ehoot). Design system: https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j (Scene, Glossary, Panda roles).

## What to build

Replace biology words in everything a user sees or hears with the Dim Sum Den words. Code identifiers, file names, event names and genomes stay as they are.

| Biology word | Den word |
|---|---|
| organism | den |
| organ | station |
| cell | panda |
| cell type | role |
| genome | recipe card |
| apoptosis | clocking out (or "clocked out" as a state word) |
| spawn / mitosis | call in |
| endocrine, homeostasis | plan usage |
| inflammation | spill |
| Brain / Muscles / Liver / Immune / Skin / Stem | The Pass / Steamers / Tea / Pantry / Front of House / Cubs |
| Level 1 · Organism, 2 · Organ, 3 · Cell | 1 · Den, 2 · Station, 3 · Panda |

The full list is in the design system's Glossary and in `CONTEXT.md` under "UI names".

- Covers text nodes, `aria-label`s, `title`s, placeholders, empty states, toasts, and the dashboard.
- Add a test that renders the main views with fixture data and fails on the words `organism`, `organ`, `cell`, `genome`, `apoptosis`, `endocrine`, `mitosis` or `inflammation` (whole word, case-insensitive) in visible text and accessible names.

**Files:** UI copy across `apps/ui/src/`; a new copy test.

## Acceptance criteria

- [ ] The copy test passes on the den, station, panda and workspace views
- [ ] Every cell `aria-label` follows "id, role, station, state"
- [ ] No code identifier or file was renamed (diff review)

## Comments

- **Created (designer, 2026-09-30):** Filed from the 09-29/30 design session; the user approved every decision in this ticket.
- **orchestrator, 2026-09-30:** Design sweep (designer, user-approved 2026-09-30): Scope added: absorbs ca/19 page <title>.
- **orchestrator, 2026-10-01:** Related: organism-infra/90 carries the den words into genomes, skills, docs and command names (user, 2026-10-01). The line above, 'Code identifiers, file names, event names and genomes stay as they are', is narrowed: genomes and command names now change in 90. Data fields and code identifiers still stay. This ticket keeps UI copy only.
