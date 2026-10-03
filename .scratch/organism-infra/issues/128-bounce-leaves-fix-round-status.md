# 128: a failed verify leaves a status the audit accepts

**Type:** fix

**Priority:** P3

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** pipeline retro 2026-10-03, cause 3. After a bounce, `board audit` flags the ticket.

## What to build

When qa verify bounced batch D1, den-v1/01, 03 and 04 were left at `in-review` with no claim lock. `board audit` (`apps/organism-infra/board-audit.mjs:178`) reports every one as `no-lock`, so a normal state between relay hops reads as an inconsistency. Pick one fix and apply it: either a release after a `fail` verdict sets a fix-round status (for example `needs-fix`) that the audit, the frontier and the bridge understand, or the audit accepts `in-review` with no lock when the latest verdict on the ticket is `fail`. Write down which one was chosen and why in the ticket's Comments.

## Acceptance criteria

- [ ] After a qa or security `fail` verdict and release, `board audit` reports nothing for that ticket.
- [ ] A ticket left `in-review` with no lock and no fail verdict is still reported as `no-lock`.
- [ ] The next developer fix round can claim the ticket without `--force`.
- [ ] `npm test` is green.

## Comments

- **Created (orchestrator, 2026-10-03):** Pipeline retro. Audit output after the D1 bounce: `den-v1/01`, `03`, `04` `no-lock`.
