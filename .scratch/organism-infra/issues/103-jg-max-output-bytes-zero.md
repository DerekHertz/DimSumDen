# 103: jg allowlist refuses `--max-output-bytes 0`

**Type:** bug

**Priority:** P3

**Blocked by:** None

**Status:** parked

## What to build

The trusted-flag allowlist in `scripts/jg.mjs` (line 43, added in organism-infra/97) accepts any digits-only value for `--max-output-bytes`, including `0`, which jg treats as unlimited. Callers pass a constant today and `dispatch-context.mjs` re-checks the size, so nothing is exposed, but the allowlist should refuse a zero (or any non-positive) value in both `--flag value` and `--flag=value` forms, the same way it refuses other bad flags.

Files: `scripts/jg.mjs`, its tests.

## Acceptance criteria

- [ ] `--max-output-bytes 0` and `--max-output-bytes=0` are refused and jg is never spawned (test)
- [ ] A positive value is still accepted (existing tests stay green)
- [ ] `npm test` green

## Comments
- **orchestrator, 2026-10-02:** Low finding from batch K's security review (97-security.md). Filed on the user's yes.
- **orchestrator, 2026-10-03:** Parked: pipeline work not blocking v1 and not a third repeat incident (refocus, docs/refocus/triage-2026-10-02.md)
