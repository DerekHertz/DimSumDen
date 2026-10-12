# 223: qa verify may make a narrow test-only fix instead of bouncing

**Type:** task

**Priority:** P2

**Status:** ready-for-agent

**Source:** orchestrator

**Class:** pipeline

**Origin:** added

**Serves:** finding:queue/04-queue-admin-user-entry-point (qa light verify bounce, 2026-10-12)

## What to build

The request, quoted as its author wrote it:

> What to build: let qa in verify mode make a narrow test-only fix itself instead of bouncing, and say so in its handoff.
>
> Why: on queue/04 (2026-10-12) qa light verify found one loosened assertion in a specify test helper (assertUntouched took an allow list). It had the fix worked out at 57k context but may change nothing, so it bounced. The bounce cost a cold developer fix round plus a second verify, roughly 110-140k tokens, for about ten lines of test code. The user asked whether the cell that knows the fix should make it.
>
> Open design choice (reviewer independence): today verify reviews a detached commit and edits nothing, so the reviewer never changes what it reviews. Settle the limits before building. A starting proposal:
> - Only test files, and only a change that tightens or restores an assertion. Never product code, never a removed or loosened assertion.
> - Only when the finding is the single reason for the bounce.
> - qa commits the fix on the ticket's branch (verify runs detached today, so cell-start and dispatch-prompt need a way to do that), re-runs the affected test files, and lists the exact change in its handoff.
> - It does not count as a bounce. Does the next cell (risk-check or security) need to look at the fix commit?
>
> Acceptance criteria:
> - The qa genome's verify section states when verify may fix in place and when it must bounce.
> - A verify cell can commit a test-only fix to the ticket's branch through the supported start path.
> - The handoff names every line it changed, and the orchestrator genome says what the relay does with a fixed-in-place verdict.
> - .claude/ files are gated: the genome edits are written as a patch in the developer handoff for the user to apply.

## Acceptance criteria

- [ ] The request above is done or answered, and the final reply says what was done.

## Comments
