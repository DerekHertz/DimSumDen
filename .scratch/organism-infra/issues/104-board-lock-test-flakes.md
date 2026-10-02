# 104: Board lock tests fail under machine load

**Type:** bug

**Priority:** P2

**Blocked by:** None

**Status:** ready-for-agent

## What to build

Two timing-based board lock tests fail when the machine is busy with other sessions, and pass when rerun alone (seen by batch K's qa verify, 2026-10-02):
- `apps/organism-infra/board-cli.test.mjs`: "a fresh write lock with a dead pid is not reclaimed before the age floor"
- `apps/organism-infra/board-status-and-lock.test.mjs`: "a taken claim lock fails fast even while the write lock is held" (took 2012 ms)

Make them deterministic (inject the clock or timeouts, or widen the bounds with a reason) without weakening what they check. Other load flakes seen the same day, for triage alongside: `dev-server-bind` port test and the Codex rate-limit test (07 developer round 5), and "Ctrl+Enter in the Note sends Deny with that note" (07).

## Acceptance criteria

- [ ] The two board lock tests pass reliably under parallel load, e.g. a stress run (recorded in the handoff)
- [ ] Their assertions still check the same lock behaviour
- [ ] `npm test` green

## Comments
- **orchestrator, 2026-10-02:** Filed on the user's yes after batch K qa verify reported the two flakes.
- **orchestrator, 2026-10-02:** Add: 07's Ctrl+Enter Note test flaked again in round 5 qa verify (about 1 full run in 3, three rounds running).
