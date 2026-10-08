# 207: dispatch-prompt prints the qa verify mode (light or full)

**Type:** chore

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** in-review

**Serves:** relay cost. Twice (den-v1/05, den-v1/06) qa light verify on Haiku ran a full verify, because it read "you ran specify" as "this session wrote the tests". Handoff 81 set this as the fix if it happened again.

## What to build

`node scripts/dispatch-prompt.mjs --cell qa --mode verify` decides light or full itself (light when a published `<NN>-qa-specify.md` handoff exists for the ticket, full otherwise) and prints one line naming it, e.g. `Verify mode: light (qa specify ran for this ticket: <handoff path>)`. Update the qa genome's verify section to follow that line instead of inferring the mode.

## Acceptance criteria

- [ ] qa verify prompts print `Verify mode: light` when a qa-specify handoff exists for the ticket, `Verify mode: full` otherwise.
- [ ] Other cells and modes print no such line.
- [ ] The qa genome edit (gated `.claude/` file) is written into the developer handoff as an exact diff for the user to apply.
- [ ] `npm test` is green.

## Comments

- **Created (orchestrator, 2026-10-08):** incident logged in usage.jsonl (den-v1/06 qa verify).
- **Retro (orchestrator, 2026-10-08):** happened again on den-v1/07 (haiku qa ran full). The wording fix failed, so this is now P1 and the next infra ticket (user approved).
- **orchestrator, 2026-10-08:** Before/after test (user, 2026-10-08): baseline from the last 19 resolved tickets (10-06 to 10-08): median 326k tokens/ticket, 5.4 cells/ticket, 23/80 cells ended at >=80k context, qa verify median 56k, incidents 23 context-budget / 11 verify-mode. After window: the first 10 tickets resolved once both 207 and 208 merge; pipeline-retro reruns the same query.
