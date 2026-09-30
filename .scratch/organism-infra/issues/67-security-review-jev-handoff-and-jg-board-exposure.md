# 67: Security review: handoff/comment text to Jev, and jg reading `.scratch/`

**Type:** review

**Priority:** P1

**What to build:** Per ADR 0015 decision 8 and its Status line, `security` reviews the Data exposure section before route's bounce half (70) or the wake-up gate (72) make any call, shadow included. Two questions: (1) may `jev.mjs` send handoff text (bounce routing) and ticket comment / gate-request text (wake) to TypeSafe's API, or should it be narrowed (for example to the bounce verdict comment plus the ticket)? (2) ad hoc `jg` calls by cells are not excluded from `.scratch/` (tracked), so tickets, handoffs and `usage.jsonl` can reach jg's provider: must cells pass the exclusion (wrapper, ignore file, genome line), or may the board go to jg's provider? Output is a verdict with any required narrowing; no code change in this ticket (fixes it names become their own tickets).

Source: `.scratch/organism-infra/spec.md`, ADR 0015.

**Blocked by:** None

**Status:** resolved

- [ ] Verdict recorded on the board for handoff text (bounce route): allowed, narrowed (state to what), or denied.
- [ ] Verdict recorded for comment and gate-request text (wake).
- [ ] Verdict recorded for the jg `.scratch/` exposure, naming the required control if any.
- [ ] Confirms one denied-path list and one secret rule owned in code once (ADR 0015 decision 8 consistency rule), or names the gap.
- [ ] Any ADR 0010/0015 text change it implies is proposed in the handoff, not made.

## Comments
- **security, 2026-09-30:** Security pass with required narrowing. (1) Handoff text to Jev: DENIED for every point. Bounce route (70) sends the ticket plus the latest bounce verdict comment only. Wake (72) sends ticket title and Status plus the one new comment (ticket class); _requests rows are never sent, code wakes on them. Code wakes without Jev on user, Scope added, verdict-event (read from events.jsonl) and unknown-author comments. (2) jg: the board must not reach jg's provider. jg 0.6.0 and 0.7.0 already skip hidden paths (.scratch/, .claude/), so ADR 0015 decision 8's premise is wrong, but a root inside .scratch and the flags --hidden, --no-ignore, --include-sensitive, --include-dependencies bypass it: required control is a genome rule plus a bash-guard rule, and the 0014 wrapper always passes --exclude for .scratch/ and .claude/. (3) Consistency gap: secret rule is owned once (SECRET_PATTERNS) but misses unquoted KEY=value, Bearer, JWT, sk_live_, github_pat_, npm_, URL credentials; no denied-path list exists in code; jev.mjs:186 reads any --tests path (Medium). New shared exposure-module ticket must block 70 and 72; 69 may proceed. Low: 38-security.md:13 gitleaks hit not allowlisted (value not printed). ADR edits proposed, not made. Details: handoffs/67-security.md.
- **security, 2026-09-30:** Verdict recorded (Security pass with required narrowing); ADR edits proposed in handoffs/67-security.md, not made
