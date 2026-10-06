# 149: Deterministic write-lock wait test (board-status-and-lock:159)

**Type:** bug

**Priority:** P2

**Blocked by:** none

**Status:** ready-for-agent

**Serves:** Testbed friction: a timing flake fails full-suite runs and costs relay cells re-runs and doubt.

## What to build

`apps/organism-infra/board-status-and-lock.test.mjs:159` (the write lock waits mid-acquire) uses a 2500 ms give-up. It failed twice under full-suite load and passes when run alone (den-v1/08). Make it deterministic: drive the wait with an injected clock or an explicit release signal instead of wall time, or widen the bound only if the code under test allows nothing better. Leave the lock's runtime behaviour unchanged.

## Acceptance criteria

- [ ] The test does not depend on wall-clock timing under load (passes 20 runs in a row with `node --test --test-concurrency` at full parallelism)
- [ ] Lock runtime behaviour is unchanged (existing lock tests pass)

## Comments

- **orchestrator, 2026-10-05:** Filed from pipeline-retro (user yes 2026-10-05). Can be batched with 148.
