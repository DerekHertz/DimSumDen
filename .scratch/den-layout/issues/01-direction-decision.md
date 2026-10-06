# den-layout 01: Record PR #162 as the visual direction

**Type:** design

**Priority:** P2

**Blocked by:** none

**Status:** ready-for-agent

**Serves:** ADR 0019 decision 8 (drift guardrails): records where the visual work goes so it does not compete with den-v1's loop.

## What to build

Docs only, no code.
1. Amend ADR 0019: PR #162 is the target visual direction for the den; it is built as its own feature (`den-layout`, see `.scratch/den-layout/spec.md`) after den-v1 05, 06 and 07 resolve. Until then den-v1's layout freeze stands.
2. Add to CONTEXT.md: **leisure area**, **build pad** (a reserved plot for a future station), and **scenery panda** (a panda with no cell type). Use the definitions in the spec's Decisions section and PR #162's description (`gh pr view 162`).

## Acceptance criteria

- [ ] ADR 0019 carries a dated amendment stating the direction, the sequencing after den-v1 05-07, and that the freeze stands until then
- [ ] CONTEXT.md defines leisure area, build pad and scenery panda, and lists the four scenery roles as not cell types
- [ ] `npm test` passes (docs tests pin some formats)

## Comments

- **orchestrator, 2026-10-06:** Filed from a grilling session (user, 2026-10-06: Q4 agree).
