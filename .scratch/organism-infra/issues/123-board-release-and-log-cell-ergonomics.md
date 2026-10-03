# 123: board release --keep-status and log-cell handoff matching

**Type:** fix

**Priority:** P3

**Blocked by:** None

**Status:** parked

## What to build

Two small friction points from ticket 11's relay (orchestrator-27 handoff):

1. `board release <ref> --keep-status` leaves the status at `claimed` instead of restoring the status the ticket had before the claim. A partial return then needs a manual status fix.
2. `scripts/log-cell.mjs` matches the cell's handoff by a `-` name pattern, so partial handoffs (e.g. `11-designer-review-partial.md`) are not found and need `--allow-no-handoff`. Match partial handoffs too, or accept `--handoff <path>`.

## Acceptance criteria

- [ ] After `claim` then `release --keep-status`, the ticket's status is what it was before the claim (test).
- [ ] `log-cell` finds a `-partial` handoff for its ticket and cell without `--allow-no-handoff` (test).
- [ ] `npm test` is green.

## Comments

- **orchestrator, 2026-10-02:** Filed from the pipeline retro, on the user's yes.
- **orchestrator, 2026-10-03:** Parked: pipeline work not blocking v1 and not a third repeat incident (refocus, docs/refocus/triage-2026-10-02.md)
