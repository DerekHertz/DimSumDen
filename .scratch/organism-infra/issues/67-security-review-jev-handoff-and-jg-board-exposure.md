# 67: Security review: handoff/comment text to Jev, and jg reading `.scratch/`

**Type:** review

**Priority:** P1

**What to build:** Per ADR 0015 decision 8 and its Status line, `security` reviews the Data exposure section before route's bounce half (70) or the wake-up gate (72) make any call, shadow included. Two questions: (1) may `jev.mjs` send handoff text (bounce routing) and ticket comment / gate-request text (wake) to TypeSafe's API, or should it be narrowed (for example to the bounce verdict comment plus the ticket)? (2) ad hoc `jg` calls by cells are not excluded from `.scratch/` (tracked), so tickets, handoffs and `usage.jsonl` can reach jg's provider: must cells pass the exclusion (wrapper, ignore file, genome line), or may the board go to jg's provider? Output is a verdict with any required narrowing; no code change in this ticket (fixes it names become their own tickets).

Source: `.scratch/organism-infra/spec.md`, ADR 0015.

**Blocked by:** None

**Status:** ready-for-agent

- [ ] Verdict recorded on the board for handoff text (bounce route): allowed, narrowed (state to what), or denied.
- [ ] Verdict recorded for comment and gate-request text (wake).
- [ ] Verdict recorded for the jg `.scratch/` exposure, naming the required control if any.
- [ ] Confirms one denied-path list and one secret rule owned in code once (ADR 0015 decision 8 consistency rule), or names the gap.
- [ ] Any ADR 0010/0015 text change it implies is proposed in the handoff, not made.

## Comments
