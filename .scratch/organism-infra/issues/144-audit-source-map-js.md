# 144: CI audit fails on source-map-js (GHSA-68fv-2mgg-jv7q)

**Type:** chore

**Priority:** P0

**Blocked by:** none

**Status:** resolved

**Serves:** Den loop (all steps): CI's dependency audit blocks every merge, including PR #157 (ADR 0016 amendment for 106).

## What to build

CI's `npm audit --audit-level=high` fails on GHSA-68fv-2mgg-jv7q (event-loop DoS via indexed source-map section offsets) in source-map-js 1.0.0-1.2.1, pulled in by vite 8.3.1 → postcss 8.5.28 → source-map-js 1.2.1. Raise it to a fixed version in the lockfile (`npm audit fix`, or an `overrides` entry if the fix needs one). No other dependency changes.

## Acceptance criteria

- [ ] `npm audit --audit-level=high` exits 0.
- [ ] `npm test` and `npm run smoke:ui` pass.
- [ ] The lockfile diff touches only source-map-js (plus any parent bump the fix requires, justified in the handoff).

## Comments

- **orchestrator, 2026-10-05:** Filed after PR #157 went red on the audit. User chose the bump over an exception (user, 2026-10-05). Owner: security.
