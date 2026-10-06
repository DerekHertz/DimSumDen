# den-layout: build the den from the PR #162 direction

Status: active, interleaved with den-v1 (user, 2026-10-06, reversing the earlier park). Design signed off as PR #162 stands; no designer pass, no annotations needed. Remaining work: connect real agents to that front end.

## Source

Draft PR #162 (`codex/lively-den-scene-lab`), a standalone, simulated review build: a wider horseshoe across a circular garden with four stations and six leisure areas, Big Bao seated at the centre, broad paths, three numbered build pads reserved at the rear for future stations, and thirteen role pandas moving between stations and leisure areas around shared site-plan obstacles.

## Decisions (user, 2026-10-06)

- PR #162 is the target visual interface. It stays an open draft as the reference; nothing from it merges until this feature is specified.
- When this feature runs, the live den's layout, resident pandas and walk-mode obstacles follow its site plan (`apps/ui/src/review/site-plan.mjs` exports circle and box obstacles).
- `release-manager`, `knowledge-keeper`, `docs-writer` and `stem-cub` are planned future roles but scenery for now: no genome, no CONTEXT.md cell-type entry until one gets a genome.
- The user's review annotations from the PR #162 session (local browser storage on the MacBook) are exported as JSON and committed to `.scratch/den-layout/annotations-<date>.json` when the MacBook is available.

## Before tickets

No designer pass (user, 2026-10-06): PR #162 is the approved mockup. Tickets come from a scout survey of PR #162 vs the bridge seams, via /to-tickets.
