# 10: Deny a sibling agent's worktree admin directory at spawn

**Type:** feature

**Priority:** P3

**Class:** product

**Blocked by:** 09

**Status:** parked

**Serves:** ADR 0021 Amendment 2, open question 2 from the architect's handoff `.scratch/agent-os/handoffs/07-architect.md`.

## What to build

After agent-os/09, a worktree agent can still write `.git/worktrees/<other>` in the main checkout: another agent's `HEAD` and index. It cannot reach refs the bridge trusts. Add a best-effort deny on sibling admin directories at spawn, or record why it stays.

## Acceptance criteria

- [ ] To be written when this is unparked.

## Comments

- 2026-10-11, orchestrator: filed and parked on the user's answer "Defer" (2026-10-11). The architect recommended deferring.
- **orchestrator, 2026-10-12:** Parked: user 2026-10-11: defer; only reaches a sibling agent's HEAD and index
