# 114: `board resolve` undo must not release another cell's lock

**Type:** bug

**Priority:** P1

**Blocked by:** 98

**Status:** ready-for-agent

## What to build

Security review of 98 (`.scratch/organism-infra/handoffs/98-security.md`, medium): `resolve`'s undo-on-failure path in `apps/organism-infra/board-service.mjs` (~1315-1323) force-releases whatever lock exists. If another cell claims a later ref between validation and the claim, `claim` fails, and the catch deletes that cell's lock, resets the status and writes a comment attributed to it. Reproduced on a temp board. Undo only when the lock's claiming cell is `orchestrator`. Also (low): add tests for the mid-batch failure and the foreign-lock case, and include a ref in the error's `resolved:` list when `release` wrote `resolved` but the usage-row append failed.

Files: `apps/organism-infra/board-service.mjs`, `apps/organism-infra/board-resolve.test.mjs`.

## Acceptance criteria

- [ ] A foreign lock claimed mid-batch survives a failed resolve, untouched
- [ ] A mid-batch failure undoes only the orchestrator's own claim and reports resolved / not attempted refs
- [ ] A ref whose release wrote `resolved` appears in `resolved:` even if the usage append failed
- [ ] `npm test` green

## Comments
- **orchestrator, 2026-10-02:** Filed from 98's security pass (one medium, two lows), user yes 2026-10-02.
