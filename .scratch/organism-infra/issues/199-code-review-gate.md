# 199: board handoff refuses a developer handoff without a code-review line

**Type:** task

**Priority:** P2

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** Relay hygiene (pipeline-retro 2026-10-08).

## What to build

Both developers in the 2026-10-08 session (142, 195) skipped the code-review pass. Wording has already failed, so add a code check. `board handoff` for a developer cell should refuse unless the State block records `code-review: ran` or `code-review: skipped (<reason>)`.

## Acceptance criteria

- [ ] A developer handoff without the code-review line is refused with a message naming the fix.
- [ ] `code-review: ran` and `code-review: skipped (reason)` are both accepted; an empty reason is refused.
- [ ] Handoffs from other cell types are unaffected.
- [ ] The handoff skill's State block lists the field (gated .claude edit, applied by the user).
- [ ] `npm test` green.

## Comments
- **orchestrator, 2026-10-08:** Filed from the pipeline-retro on the user's yes.
