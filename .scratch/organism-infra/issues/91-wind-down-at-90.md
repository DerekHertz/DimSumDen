# 91: wake prelude wind-down at 90% (5-hour window)

**Type:** feature

**Priority:** P2

**Blocked by:** None

**Status:** resolved

## What to build

User decision (2026-10-01): the 5-hour wind-down moves from 80% to 90%. `scripts/jev-wake-prelude.mjs` has `USAGE_WIND_DOWN = 0.8` (line 17) and its comments and tests pin 80%. Change the constant to 0.9, update its comments and `jev-wake-prelude*.test.mjs` (79.9%/80% boundaries become 89.9%/90%), and check `usage-watch` helpers in `scripts/` for the same number. The weekly window stays at 80%. The `.claude/` and CLAUDE.md prose edits ship as a user-run script (`apply-90-limit.mjs`); this ticket is the code side only.

## Acceptance criteria

- [ ] Frontier wake is suppressed at 90% or more and not at 89.9% (test)
- [ ] Wind-down items still wake at 90% or more (existing tests, new boundary)
- [ ] No remaining 80% 5-hour reference in `scripts/` except the weekly check

## Comments

- **orchestrator, 2026-10-01:** Filed on the user's "limit to 90% for 5 hour window". Small; fold into the next developer batch (e.g. with 88 and 89).
- **orchestrator, 2026-10-02:** batch K = organism-infra/97-jg-resource-limit-full-root + organism-infra/91-wind-down-at-90 (both in scripts/). One relay, one branch, one PR (user approved 2026-10-02).
- **orchestrator, 2026-10-02:** 91 done at ba57b9a on feat/jg-limit-batchK. User decision: it stays in batch K and ships with 97.
- **qa, 2026-10-02:** QA pass at 97275b0: npm test 1729/1729, qa tests unchanged; see 91-qa-verify.md
- **security, 2026-10-02:** Security pass at 97275b0. No findings: one constant (0.8 to 0.9) and a comment in scripts/jev-wake-prelude.mjs, no new input or exposure. Details: handoffs/91-security.md.
