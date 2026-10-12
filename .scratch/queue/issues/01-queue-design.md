# 01: Queue design: ADR 0015 amendment and the Queue term

**Type:** design

**Priority:** P1

**Blocked by:** none

**Status:** resolved

**Serves:** `.scratch/queue/spec.md` (confirmed by the user 2026-10-12), "Amends" and "Open for the architect".

## What to build

Read `.scratch/queue/spec.md`. Its 15 decisions are settled by the user; do not reopen them. Write the design that lets them be built:

- An amendment to ADR 0015 (decision 4 and Amendment 2, frontier order), status proposed, recording the 15 decisions and your answers to the four points under "Open for the architect" in the spec.
- The term **Queue** in `CONTEXT.md` (spec decision 14). `CONTEXT.md` currently lists "queue" as a word to avoid for the Board; fix that line so the two do not contradict.
- The existing order code is `rankFrontier` in `scripts/jev.mjs` (shadow only; the aging bump is in the ADR but not in the code).

No product code. Docs only, on a branch, no PR merge.

## Acceptance criteria

- [ ] The ADR 0015 amendment is written (proposed) and covers all 15 spec decisions.
- [ ] Each of the four open points in the spec has one answer with its reason: where class and "planned" are recorded; where the active-feature row lives and whether the command can refuse a non-user caller; whether the order moves from `scripts/jev.mjs` to the board CLI and what happens to `jev-order` rows; the exact orchestrator genome edits for loop steps 5 and 6 (written out as a diff in the handoff, since `.claude/` is gated).
- [ ] `CONTEXT.md` defines **Queue** and no longer contradicts it.
- [ ] The handoff proposes a ticket breakdown: each ticket's scope, files, blockers, and which need full `security`. Include the day-one gate run (spec decision 13) as its own step.
- [ ] Anything the amendment could not prove is listed as not proven.

## Comments

- **orchestrator, 2026-10-12:** filed on the user's "Yes, go to the architect" after the grilling session. The breakdown in the handoff feeds /to-tickets; the user approves it before any ticket is published.
- **orchestrator, 2026-10-12:** user rulings on the three questions: (1) den-v1 is the active feature; den-layout competes in the rest. (2) Keep ADR 0019 decision 8, checked in code (ticket 03). (3) The Class backfill rule is approved; the list is shown in ticket 08 before anything is written. Breakdown approved as seven tickets (Q1 to Q7), published as queue/02 to queue/08. The user asked why seven and was offered a four-ticket cut; they chose seven.
