# 16: runSpikes S4b test failed once under the full suite

**Type:** bug

**Priority:** P3

**Blocked by:** none

**Status:** ready-for-agent

**Serves:** a trustworthy `npm test`. A test that fails under load hides real failures.

## What happens

`apps/bridge/cells/conformance.test.mjs:1114`, "runSpikes S4b: the in-flight tool is a real process, running when EOF and SIGTERM land, and it is not a sleep command", failed once in a full `npm test` run on 2026-10-10 (branch `spike/agent-os-01-wall`) and then passed three times out of three when its file was run alone.

The failing assertion was not recorded. The test starts child processes and checks that a tool process is alive at the moment stdin EOF and SIGTERM land, so timing under a loaded machine is the first suspect, but that is a guess.

It is not on the known-flaky list (`proximity-card.browser.test.mjs`, `floating-cards.test.mjs`, `tally-expand.test.mjs`).

## What to build

Reproduce it first, then fix the cause. Do not raise a timeout or add a retry before the failing assertion is known.

## Acceptance criteria

- [ ] The failure is reproduced (for example the full suite in a loop, or the file under CPU load) and the failing assertion and its message are written here.
- [ ] The cause is fixed, or, if it cannot be reproduced in 20 full runs, that is written here and the ticket is closed.
- [ ] `npm test` passes this test in 20 consecutive full runs.

## Comments

- 2026-10-10, plain session (Opus 5.5): filed after one failure in a full run. Not started.
