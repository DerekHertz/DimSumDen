# 196: Over the approval cap, deny the new request, not the oldest

**Type:** task

**Priority:** P2

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** Den loop steps 3-4 (the steering approvals inbox from 141).

Scope source: 141 (PR #187) and `.scratch/organism-infra/handoffs/141-security-2.md`. Decision: the user, 2026-10-08.

## What to build

`apps/bridge/cells/approvals.mjs` caps pending approvals per agent at `APPROVAL_CAP_PER_AGENT` (`apps/bridge/cells/policy.mjs`). Today, at the cap, it settles the **oldest** pending approval as `cap-exceeded` and accepts the new one. So a flood of requests silently pushes out the one the user may be reading.

Change it so that, at the cap, the **new** request is denied straight away with reason `cap-exceeded`, and every pending approval stays as it was. The denial goes through the same path as the other system denies: same audit `decision` line, same end state and reason fields.

## Acceptance criteria

- [ ] With an agent at the cap, a new request is denied at once with reason `cap-exceeded`, and the runtime gets the deny.
- [ ] All the approvals already pending for that agent stay pending, unchanged.
- [ ] Other agents' approvals are unaffected.
- [ ] The audit line for the denied request matches the other system denies.
- [ ] Update any existing 141 test that pins the deny-oldest behaviour; don't add a second, conflicting one.

## Comments
- **orchestrator, 2026-10-08:** Filed on the user's call ("deny the new one"). Security round 2 on 141 didn't rule either way. This is a behaviour change only, with no new routes.
