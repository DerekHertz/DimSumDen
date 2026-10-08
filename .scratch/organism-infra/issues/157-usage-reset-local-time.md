# 157: usage.mjs reports reset times in the system time zone

**Type:** feature

**Priority:** P3

**Blocked by:** none

**Status:** in-review

**Serves:** The orchestrator tells the user when the 5-hour window resets in the user's own time, not UTC.

User request 2026-10-06 (system time zone is US Pacific). User decision: add a field, do not replace the canonical one.

## What to build

`scripts/usage.mjs` keeps each window's canonical `resets_at` (ISO, UTC) unchanged and adds `resets_local`: the same instant in the system time zone, with the zone abbreviation (e.g. `2026-10-06 00:00 PDT`), for both the Claude and Codex adapters. Unknown reset times stay unknown. The `usage-watch` skill says to quote `resets_local` to the user (a `.claude/` edit: the developer writes the exact change in its handoff for the user to apply).

## Acceptance criteria

- [ ] Each window in the output has `resets_local` in the system time zone; `resets_at` is byte-for-byte unchanged.
- [ ] Tests pin the conversion with a fixed `TZ` (e.g. `America/Los_Angeles`, across a DST change) and cover a missing reset time.
- [ ] Existing readers of `resets_at` still pass.
- [ ] The usage-watch skill edit is written in the handoff for the user to apply.

## Comments
- **qa, 2026-10-08:** qa specify: 13 tests in scripts/usage-reset-local.test.mjs (12 red); existing keychain/provider tests extended. AC4 (skill edit) human-verified. See handoffs/157-qa-specify.md
