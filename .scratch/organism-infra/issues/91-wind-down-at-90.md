# 91: wake prelude wind-down at 90% (5-hour window)

**Type:** feature

**Priority:** P2

**Blocked by:** None

**Status:** ready-for-agent

## What to build

User decision (2026-10-01): the 5-hour wind-down moves from 80% to 90%. `scripts/jev-wake-prelude.mjs` has `USAGE_WIND_DOWN = 0.8` (line 17) and its comments and tests pin 80%. Change the constant to 0.9, update its comments and `jev-wake-prelude*.test.mjs` (79.9%/80% boundaries become 89.9%/90%), and check `usage-watch` helpers in `scripts/` for the same number. The weekly window stays at 80%. The `.claude/` and CLAUDE.md prose edits ship as a user-run script (`apply-90-limit.mjs`); this ticket is the code side only.

## Acceptance criteria

- [ ] Frontier wake is suppressed at 90% or more and not at 89.9% (test)
- [ ] Wind-down items still wake at 90% or more (existing tests, new boundary)
- [ ] No remaining 80% 5-hour reference in `scripts/` except the weekly check

## Comments

- **orchestrator, 2026-10-01:** Filed on the user's "limit to 90% for 5 hour window". Small; fold into the next developer batch (e.g. with 88 and 89).
