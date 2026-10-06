# 154: Dispatch and steer more than one agent from the UI

**Type:** design-question

**Priority:** P2

**Blocked by:** 140

**Status:** ready-for-agent

**Serves:** Den loop steps 3-4: the user can reach every agent in the system from the Den.

## What to build

Today (ADR 0011/0016 as written) the UI dispatch gate appears only on `frontier[0]` when no ticket holds a lock, so `POST /agents` is effectively one agent at a time; the cap of 2 is reachable only through the internal `start()`. The user wants to interact with every agent in the system from the UI (2026-10-06). Architect: propose gate rules that let the UI dispatch further frontier tickets up to the caps, and amend ADR 0011/0016.

## Acceptance criteria

- [ ] An ADR amendment states when the UI offers dispatch for a second (and later) ticket, within `max_concurrent_cells` and the 8-session cap.
- [ ] Implementation tickets are filed for the change.

## Comments

- **orchestrator, 2026-10-06:** Filed from the user's answer to the 140 architect's question 2. Architect first.
