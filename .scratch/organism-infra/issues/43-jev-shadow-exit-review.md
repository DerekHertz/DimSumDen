# 43: Jev shadow-mode exit review

**Type:** decision

**Priority:** P2

**What to build:** After 5 shadow tickets, run jev-report with the user and decide per call point: go live, adjust, or drop. Design: docs/adr/0010-jev-precheck-tier-and-verify-depth.md.

**Blocked by:** 38, 39, 41

**Status:** closed

- [ ] Exit criteria table reviewed with the user
- [ ] Decision recorded in ADR 0010 or a successor

## Comments

- **Created (orchestrator, 2026-09-28):** Follow-up of 04 (ADR 0010), published with the user's yes.
- **orchestrator, 2026-09-29 (cloud 3):** Reviewed the exit table with the user (tier: 22 tickets, 2 bounces, projected +11.5% tokens; verify: 18 tickets, 2 bounces, projected -6.0%). User decision: **verify goes live** once 58 (verify floor) merges, and actual savings get measured on real tickets against baseline. **Tier stays in shadow** until it's adjusted. Next: record this in ADR 0010 and flip verify to live after 58.
- **orchestrator, 2026-10-03:** Closed: superseded by organism-infra/68 re-scoped to outcome bars (refocus, docs/refocus/triage-2026-10-02.md)
