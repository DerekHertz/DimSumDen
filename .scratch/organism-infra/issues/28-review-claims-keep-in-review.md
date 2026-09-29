# 28: Review claims should not clobber in-review status

**Type:** bug

**What to build:** When qa (verify) or security claims a ticket at `in-review`, the claim rewrites the status to `claimed`, and neither cell can set `in-review` back. Found in the ticket 24 relay. A verify or security claim should keep `in-review`, or release should restore the pre-claim status.

**Blocked by:** 24 (same CLI surface)

**Status:** resolved

- [ ] A qa-verify or security claim on an `in-review` ticket leaves it `in-review` after release
- [ ] Tests cover both cells

## Comments
- **qa, 2026-09-28:** QA pass: 243/243 tests, specify tests unchanged, diff matches criteria.
- **security, 2026-09-28:** Security pass at b39f990. Claim change only widens nothing: lock exclusivity, reclaim, resolve and release gates untouched; identity spoof gains no capability. 2 low/info notes (lock not status signals a review in flight; stale reclaim comment at board-service.mjs:752). See handoffs/28-security.md.
- **Resolved (orchestrator, 2026-09-28):** Merged as PR #29. ADR 0008 decision 10, issue-tracker and organism-protocol updated. Stale comment at board-service.mjs:752 left for a code ticket.
