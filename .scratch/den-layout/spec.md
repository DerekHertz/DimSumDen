# den-layout: build the den from the PR #162 direction

Status: parked (until den-v1 05, 06 and 07 resolve; user, 2026-10-06). Ticket 01 (the decision record) is ready now.

## Source

Draft PR #162 (`codex/lively-den-scene-lab`), a standalone, simulated review build: a wider horseshoe across a circular garden with four stations and six leisure areas, Big Bao seated at the centre, broad paths, three numbered build pads reserved at the rear for future stations, and thirteen role pandas moving between stations and leisure areas around shared site-plan obstacles.

## Decisions (user, 2026-10-06)

- PR #162 is the target visual interface. It stays an open draft as the reference; nothing from it merges until this feature is specified.
- When this feature runs, the live den's layout, resident pandas and walk-mode obstacles follow its site plan (`apps/ui/src/review/site-plan.mjs` exports circle and box obstacles).
- `release-manager`, `knowledge-keeper`, `docs-writer` and `stem-cub` are planned future roles but scenery for now: no genome, no CONTEXT.md cell-type entry until one gets a genome.
- The user's review annotations from the PR #162 session (local browser storage on the MacBook) are exported as JSON and committed to `.scratch/den-layout/annotations-<date>.json` when the MacBook is available.

## Before tickets

Designer `direction` mode with product, against PR #162 and the annotations; mockups approved before any code.
