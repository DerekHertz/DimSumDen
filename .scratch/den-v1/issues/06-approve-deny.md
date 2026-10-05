# 06: A/D: approve or deny a permission request from the card

**Type:** feature

**Priority:** P1

**Blocked by:** organism-infra/106

**Status:** ready-for-agent

**Serves:** Den loop steps 3-4 (answer a pending permission request; the agent continues).

## What to build

When the card's agent has a pending approval, **A** and **D** first show the full tool input (`GET /approvals/:id`, token required), then send `POST /approvals/:id` with `allow` or `deny` through the bridge client in `apps/ui/src/state/`. The card shows the refusal reason if the bridge refuses, and the panda's state changes when the agent continues.

## Acceptance criteria

- [ ] A then confirm sends exactly one allow request to the right route with the token; D sends deny.
- [ ] The tool input is shown before any decision is sent.
- [ ] A refused request shows the bridge's reason and changes nothing.
- [ ] `npm test` is green.

## Comments

- **Created (orchestrator, 2026-10-03):** From `.scratch/den-v1/spec.md` (ADR 0019). Keep under ~120k tokens; split rather than stretch.
- **orchestrator, 2026-10-04:** Dropped the `Blocked by` edge to den-v1/04 (user, 2026-10-04); 04 stays parked.
