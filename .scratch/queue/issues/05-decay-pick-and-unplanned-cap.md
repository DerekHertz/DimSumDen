# 05: Decay, `board pick` and the unplanned cap

**Type:** code

**Priority:** P1

**Class:** product

**Origin:** spec

**Blocked by:** 03, 04

**Status:** in-review

**Serves:** `.scratch/queue/spec.md` decisions 8 (a pick resets decay), 9, 10; ADR 0015 Amendment 3.

## What to build

Tickets that sit in the Queue decay and are parked, and unplanned work is capped. Design: ADR 0015 Amendment 3 and `.scratch/queue/handoffs/01-architect.md` (Q4).

- The decay count comes from resolved rows, `queue-pick` rows and each ticket's ready-since time, in `apps/organism-infra/frontier-queue.mjs`.
- `npm run board -- pick <ref> [--deviation "<why>"]` in `apps/organism-infra/board.mjs` writes a `queue-pick` row; a pick resets that ticket's decay.
- `board gate --apply` also parks tickets whose decay has run out.
- The unplanned cap: security findings count toward it but are never refused by it.

## Acceptance criteria

- [ ] The decay-left count in `board queue` falls as other tickets resolve and resets when the ticket is picked, tested with literal rows.
- [ ] `board pick <ref>` writes one `queue-pick` row; `--deviation` records the reason.
- [ ] `board gate` lists expired tickets in its dry run and parks them only with `--apply`.
- [ ] A ticket over the unplanned cap is refused with a reason; a security finding over the cap is counted and admitted.

## Comments

- **orchestrator, 2026-10-12:** published from the architect's breakdown (Q4) on the user's approval.
- **developer, 2026-10-12:** developer: test 5 in queue-decay.test.mjs (line 138) looks wrong: expects the picked ticket's decayLeft 5, but a resolved row at 10-07T12:00 is after the pick at 10-07T00:00, so 4 is correct. I did not edit it. qa to fix (pick ts 10-08, or expect 4). Everything else passes; see handoffs/05-developer.md.
- **developer, 2026-10-12:** qa test 5 asserts a wrong decayLeft; qa must fix, implementation done at a8ffdbe
