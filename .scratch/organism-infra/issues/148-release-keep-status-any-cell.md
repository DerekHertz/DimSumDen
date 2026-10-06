# 148: board release --keep-status restores the pre-claim status for any cell

**Type:** bug

**Priority:** P2

**Blocked by:** none

**Status:** ready-for-agent

**Serves:** Testbed friction: unusual relay hops leave tickets in the wrong state and need a manual fix by the orchestrator.

## What to build

`board release <ref> --keep-status` restores the ticket's status from before the claim only for qa specify. Two hops went wrong. A design-only security review on a `ready-for-agent` ticket (106) left the ticket `claimed`. A qa specify fix round on an `in-review` ticket (den-v1/08) couldn't release with `--status in-review`. Make `--keep-status` restore whatever status the ticket had before the claim, for any cell. The lock already records that status, or it can. The handoff validation rules (ADR 0008 decision 11) stay as they are.

## Acceptance criteria

- [ ] `--keep-status` after a claim on `ready-for-agent` returns the ticket to `ready-for-agent` for security, architect and qa (test)
- [ ] `--keep-status` after a claim on `in-review` returns `in-review` (test)
- [ ] The release event records the restored status (test)

## Comments

- **orchestrator, 2026-10-05:** Filed from pipeline-retro (user yes 2026-10-05). Can be batched with 149 (same area: apps/organism-infra).
