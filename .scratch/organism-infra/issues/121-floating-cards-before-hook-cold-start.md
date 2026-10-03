# 121: floating-cards before() hook fails under many cold Vite starts

**Type:** fix

**Priority:** P3

**Blocked by:** None

**Status:** ready-for-agent

## What to build

`apps/ui/src/overlay/floating-cards.test.mjs` has a `before()` hook that waits up to 30 s for the chip tally. When many Vite dev servers cold-start at once (parallel test files, or a loaded CI runner), that wait times out and the whole file fails. Found by ticket 104's developer; 104 widened only the Ctrl+Enter timeouts and left this one.

Make the hook robust without hiding real failures: wait on a readiness signal from the dev server instead of a fixed budget, or bound the number of concurrent cold starts, and fail with a clear message naming what it was waiting for.

## Acceptance criteria

- [ ] With 6 or more concurrent cold Vite starts on the test machine, floating-cards.test.mjs passes 20 runs in a row.
- [ ] A genuinely stuck dev server still fails the hook, with a message that names the missing signal.
- [ ] `npm test` is green.

## Comments

- **orchestrator, 2026-10-02:** Filed from 104's handoff (deferred flake). Not in the 104 PR (#145).
