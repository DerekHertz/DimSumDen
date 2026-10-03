# 83: Board audit: flag in-review without lock only after 24h of no activity

**Type:** fix

**Priority:** P3

**What to build:** The board audit (81) flags every `in-review` ticket with no `.lock`, but that is the normal state while a ticket waits for qa verify. Flag it only when the ticket has had no activity (status row, comment, or handoff) for 24 hours. Keep the threshold a named constant.

**Blocked by:** 81

**Status:** parked

- [ ] An `in-review` ticket with no lock and activity under 24h ago is not flagged (test)
- [ ] The same ticket with no activity for 24h or more is flagged (test)
- [ ] Other audit checks are unchanged (existing tests pass)

## Comments

- **Created (orchestrator, 2026-09-30):** User chose a follow-up over a batch A fix round.
- **orchestrator, 2026-10-03:** Parked: pipeline work not blocking v1 and not a third repeat incident (refocus, docs/refocus/triage-2026-10-02.md)
