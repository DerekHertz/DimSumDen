# 03: Admission gate: `board gate` and ticket header lines

**Type:** code

**Priority:** P1

**Class:** product

**Origin:** spec

**Blocked by:** 02

**Status:** ready-for-agent

**Serves:** `.scratch/queue/spec.md` decisions 4 (refusal), 6, 7; ADR 0015 Amendment 3; ADR 0019 decision 8.

**Security:** full `security` review (it reads `spec:<feature>` paths named by ticket text and parks tickets).

## What to build

`npm run board -- gate` lists the tickets the admission gate would park, and parks them only with `--apply`. Design: ADR 0015 Amendment 3 and `.scratch/queue/handoffs/01-architect.md` (Q2).

- Parse the machine forms of the Class, Origin and Serves header lines and the P0 reason, in `apps/organism-infra/frontier-queue.mjs`.
- `checkAdmission` decides whether a ticket is admitted and gives the reason when it is not.
- `board gate [--apply]` in `apps/organism-infra/board.mjs`: a dry run by default; `--apply` parks with the reason through the existing park path.
- `board create --class --serves --origin --p0-reason` in `apps/organism-infra/board-service.mjs` (`createTicket`) writes the header lines and refuses a P0 with no reason.
- Keep ADR 0019 decision 8 (user, 2026-10-12): a pipeline ticket is admitted without three incidents when an active-feature ticket lists it in Blocked by.
- `board queue` (ticket 02) now fills its parked-by-gate list.

## Acceptance criteria

- [ ] `checkAdmission` admits and refuses per spec decisions 6 and 7, each refusal with a reason, tested with literal tickets.
- [ ] A pipeline ticket listed in an active-feature ticket's Blocked by is admitted without three incidents.
- [ ] `board gate` with no flag writes nothing; `--apply` parks each refused ticket with its reason.
- [ ] `board create` writes Class, Origin and Serves lines and refuses a P0 with no `--p0-reason`.
- [ ] A `spec:<feature>` path in ticket text cannot make the gate read a file outside `.scratch/`.
- [ ] The handoff reports how many organism-infra pipeline tickets pass the three-incidents rule when it is run over the real `usage.jsonl` (the architect did not prove that the same `tool` means the same cause).

## Comments

- **orchestrator, 2026-10-12:** published from the architect's breakdown (Q2) on the user's approval. Do not run at the same time as ticket 04: both touch `board.mjs` and `frontier-queue.mjs`.
