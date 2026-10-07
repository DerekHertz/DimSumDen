# 135: Flaky UI test: "Ctrl+Enter in the Note sends Deny" in floating-cards

**Type:** bug

**Priority:** P2

**Blocked by:** None (can start immediately)

**Status:** parked

**Serves:** relay reliability (retro, 2026-10-04; user approved filing): a test that fails at random makes `npm test` results untrustworthy for every ticket's developer and qa verify.

## What to build

`apps/ui/src/overlay/floating-cards.test.mjs`, test "Ctrl+Enter in the Note sends Deny…" (ruling: m), fails intermittently. During organism-infra/134 it failed for the developer (also when run in isolation) and on `main` (after about 21 s), then passed in a later full `npm test` run (2017/2017) and in CI on PR #153. Nothing in 134 touched it.

Find the cause of the intermittent failure and fix it, in the test or in the code under test, whichever is wrong.

## Acceptance criteria

1. The cause of the intermittent failure is identified and written in the handoff (timing, shared state, test order, environment, or other).
2. The test passes in 20 consecutive isolated runs and in 3 consecutive full `npm test` runs, on macOS and in CI.
3. The test still checks that Ctrl+Enter in the Note sends Deny; it is not skipped, deleted or weakened.
4. If the cause is in the code under test, the fix has its own test.

## Comments

- 2026-10-04 orchestrator: filed from the retro after 134. Evidence: `.scratch/organism-infra/handoffs/134-developer.md` (failures).
- **orchestrator, 2026-10-07:** Parked: User 2026-10-07: north star first (den v1 loop). Pipeline work waits; unpark after den-v1/07 or on a 3rd repeat incident that blocks the relay.
