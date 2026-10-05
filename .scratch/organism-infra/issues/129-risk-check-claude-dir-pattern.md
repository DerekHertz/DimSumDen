# 129: risk-check flags changes under `.claude/`

**Type:** task

**Priority:** P2

**What to build:** `npm run risk-check` currently has no pattern for `.claude/**`, so a diff that edits a genome, a skill or the settings file exits clean and skips `security`. Add one, so any such diff is a hit and dispatches `security`. This is the detection step of ADR 0016 decision 6.10: a daemon-spawned cell can edit its own permission surface, and the review must see it. It is also useful for interactive cells today.

**Blocked by:** None

**Status:** parked

- [ ] A diff touching any path under `.claude/` makes `risk-check` report a hit with a reason naming the pattern (test)
- [ ] A diff touching only unrelated paths is still clean (test)
- [ ] Existing risk-check behaviour and tests are unchanged
- [ ] The orchestrator genome or relay docs that describe the patterns are not edited by this ticket; any needed wording change is proposed in the handoff

## Comments
- **Created (orchestrator, 2026-10-01):** from ADR 0016 decision 6.10 and security's round 1 and 2 reviews (handoffs `11-security-2.md`, `11-security-3.md`).
- **orchestrator, 2026-10-04:** Filed from the Mac session of 2026-10-01, where it was ticket 85 and never pushed. Renumbered because main reused 82-94. Other Mac numbers in the body map to main as: 83, 84 -> 105; 86, 87, 88, 89 -> 106; 90 -> 107.
- **orchestrator, 2026-10-05:** Parked: Parked at filing (user, 2026-10-04): refocus rules supersede; names no v1 den-loop step or repeated testbed friction (docs/refocus/triage-2026-10-02.md)
