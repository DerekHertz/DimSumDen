# den-layout 01: Record PR #162 as the visual direction

**Type:** design

**Priority:** P2

**Blocked by:** none

**Status:** resolved

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

**orchestrator (2026-10-06), user decision after the first architect pass (dc872d7):** den-layout is unparked and runs interleaved with den-v1, not after 05/06/07. ADR 0019 amendment 1 must record: (a) den-layout active alongside den-v1, relaxing decision 8's one-active-feature rule for these two; (b) PR #162's layout is approved as-is, lifting decision 7's layout freeze for it; (c) no designer pass: the user did the visual checks and signed the design off; the remaining work is connecting real agents (bridge) to that front end. The MacBook review annotations are not needed.
