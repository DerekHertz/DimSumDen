# 01: Genome contract block and its mechanical check

**Type:** feature

**Priority:** P1

**Blocked by:** organism-infra/90 (both edit genomes; sequence 90 first)

**Status:** ready-for-agent

**Design refs:** `.scratch/crew-dashboard/spec.md`

## What to build

Genomes gain optional `triggers`, `refuses` and `outcomes` keys under `organism:` (see the spec's Implementation Decisions). The existing mechanical genome check (ADR 0009) accepts and validates them: allowed trigger forms, a short `refuses` list, `outcomes` drawn from `done`, `noop`, `clarify`, `blocked`, `failed`. All nine genomes in `.claude/agents/` get the block. Genomes with none of the keys still pass.

Touches the genomes, which are `.claude/` files, so the CI approval gate (organism-infra/22) and a user approval of the genome edits apply.

## Acceptance criteria

- [ ] A genome with a valid contract block passes the check; an unknown trigger form or outcome fails with a message naming the field
- [ ] A genome with no contract keys still passes
- [ ] All nine genomes carry a contract block reviewed by the user (`human-verified`)
- [ ] `CONTEXT.md` terms stay consistent (Outcome)

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
