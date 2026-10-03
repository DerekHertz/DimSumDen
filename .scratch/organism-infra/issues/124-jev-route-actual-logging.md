# 124: Jev route rows record the role really dispatched

**Type:** fix

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** ADR 0019 decision 5 (Jev routes each step; route needs usable shadow data before it runs advisory).

## What to build

Every `kind:"jev"` row with `point:"route"` in `.scratch/usage.jsonl` has `actual:"orchestrator"` (21 of 21 non-fallback rows), so route agreement and outcomes cannot be measured. `actual` must be the role that was really dispatched next on that ticket, read from the board (the next claim event on the ticket after the route call, ADR 0015 decision 3), not the caller. Fix the writer in `scripts/jev.mjs` (and `scripts/jev-report.mjs` if it joins rows), and give the report a way to backfill `actual` for existing rows from `.scratch/events.jsonl` without rewriting history in place (a derived view is fine).

## Acceptance criteria

- [ ] A route call followed by a `developer` claim on that ticket yields a row (or report line) with `actual: "developer"`; a `qa --mode specify` claim yields `qa-specify`.
- [ ] Existing rows report their real next role in `jev-report` output; `usage.jsonl` lines are not edited.
- [ ] No ticket with a route row and a later claim reports `actual: "orchestrator"` unless the orchestrator really claimed it.
- [ ] `npm test` is green.

## Comments

- **Created (orchestrator, 2026-10-03):** Refocus session (ADR 0019, docs/refocus/triage-2026-10-02.md).
