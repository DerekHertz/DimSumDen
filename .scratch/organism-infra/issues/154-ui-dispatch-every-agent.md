# 154: Dispatch and steer more than one agent from the UI

**Type:** design-question

**Priority:** P2

**Class:** product

**Blocked by:** 140

**Status:** resolved

**Serves:** Den loop steps 3-4: the user can reach every agent in the system from the Den.

## What to build

Today (ADR 0011/0016 as written) the UI dispatch gate appears only on `frontier[0]` when no ticket holds a lock, so `POST /agents` is effectively one agent at a time; the cap of 2 is reachable only through the internal `start()`. The user wants to interact with every agent in the system from the UI (2026-10-06). Architect: propose gate rules that let the UI dispatch further frontier tickets up to the caps, and amend ADR 0011/0016.

## Acceptance criteria

- [ ] An ADR amendment states when the UI offers dispatch for a second (and later) ticket, within `max_concurrent_cells` and the 8-session cap.
- [ ] Implementation tickets are filed for the change.

## Comments

- **orchestrator, 2026-10-06:** Filed from the user's answer to the 140 architect's question 2. Architect first.
- **orchestrator, 2026-10-12:** architect done (branch `architect/154-ui-dispatch-every-agent`, 1e4c73d, docs only, pushed, no PR yet). Tickets 226 to 228 are drafted in `handoffs/154-architect.md` and **not filed**: the user is reading them first. User rulings, 2026-10-12: (1) raise the live-agent cap to 8 ("just raise it to max 8"); the amendment as written says max 2, cap 8, so 226 and the ADR text need that change. (2) A stale lock from a dead holder counts toward the cap, and claimed locks must be very visible in the UI so the orchestrator or the user can clear them. (3) Goal: send work to several headless agents from the interface by end of day. The user also wants the orchestrator to find work and pass it to headless sessions instead of running every cell from one session; that has no spec yet.
- **orchestrator, 2026-10-12:** ADR 0011 decision 3 and ADR 0016 amendment 14 merged; implementation tickets 226-228 filed
