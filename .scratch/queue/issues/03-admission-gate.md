# 03: Admission gate: `board gate` and ticket header lines

**Type:** code

**Priority:** P1

**Class:** product

**Origin:** spec

**Blocked by:** 02

**Status:** in-review

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
- [ ] `createTicket` (options `class`, `origin`, `serves`, `p0Reason`) writes Class, Origin and Serves lines and refuses a P0 with no reason. No `board create` CLI subcommand is required (user, 2026-10-12).
- [ ] A `spec:<feature>` path in ticket text cannot make the gate read a file outside `.scratch/`.
- [ ] The handoff reports how many organism-infra pipeline tickets pass the three-incidents rule when it is run over the real `usage.jsonl` (the architect did not prove that the same `tool` means the same cause).

## Comments

- **orchestrator, 2026-10-12:** published from the architect's breakdown (Q2) on the user's approval. Do not run at the same time as ticket 04: both touch `board.mjs` and `frontier-queue.mjs`.
- **qa, 2026-10-12:** light verify: escalate to full verify. Light steps 1, 2 and 4 are clean (saved suite 4360 pass, 0 fail, 0 skipped; test file unchanged since 4df65d9; no out-of-scope files). Criterion 4 names a board create command, which does not exist; createTicket is tested and no CLI subcommand was built. Scope call needed. Detail in handoff.
- **qa, 2026-10-12:** Handoff: .scratch/queue/handoffs/03-qa-verify.md (light verify escalated to full).
- **orchestrator, 2026-10-12:** user ruling on the scope call: `createTicket` is the accepted write surface; no `board create` subcommand is required. Criterion 4 is reworded to say so. Criterion 6 is human-verified (no test): the developer's handoff reports 0 of 10 ready organism-infra tickets passing the three-incidents rule over the real `usage.jsonl`.
- **qa, 2026-10-12:** qa, light verify on b9b5403: QA pass. Suite (saved output): 4360 pass, 0 fail, 0 skipped. Test file unchanged since 4df65d9. Criteria 1-5 mapped to tests; criterion 6 human-verified. All changed files in scope. Detail in handoff 03-qa-verify-2.md.
