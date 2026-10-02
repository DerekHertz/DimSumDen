# 94: CI flakes and slows on the browser tests (investigate)

**Type:** bug

**Priority:** P1

**Blocked by:** None

**Status:** in-review

## What to build

CI's `test` job failed or was cancelled three times on 2026-10-01 with no code change between a pass and a fail. Find the cause and make the job stable and faster. Each flake costs a rerun (10-15 minutes of waiting, and the orchestrator's usage while it waits).

Evidence (all in `.github/workflows/ci.yml`, job `test`, `timeout-minutes: 15`, `npm test`):

- Run 36889668507 (PR 118, `feat/den-scene-09-headgear`): 3 failures, all in `apps/ui/src/scene/tally-expand.test.mjs`: `locator.click: Timeout 8000ms exceeded` on `button.chip-tally`, call log ends "click action done / waiting for scheduled navigations to finish". Same code passed locally (1567) and on the rerun (13m19s).
- Run 36892672737 (`main` at 27f6a82, after PR 118 merged): failed 2 tests, `npm run smoke:ui passes on main...` and `click on the pill opens the card in place...` (tally-expand).
- Run 36894900261 (PR 121, `feat/batch-groups93`, a script-only change): the `test` job was cancelled at 15m16s by the 15-minute timeout; no test reported failing. The rerun is the proof it is not the code.
- Baseline, run 36890740628 (PR 119): pass, `# duration_ms 490705` (8.2 min). Earlier today's runs took 3-4 minutes; since 05 landed they take 7-10, with spikes to 15+.
- Where the time goes (run 36890740628): about 15 tests in `tally-expand.test.mjs` take 15-42 s each (roughly 5 of the 8 minutes) plus `smoke:ui` at 30 s. Everything else is fast.

Hypothesis (not proven): the Tally browser tests each start their own page with the WebGL scene on a software renderer, node:test runs files in parallel, and CPU contention on the 2-core runner pushes the 8 s click timeout over the line.

Things to check: how many browsers/dev servers the suite starts and whether tests can share one per file; node:test concurrency for the browser files (`--test-concurrency`); the 8 s timeouts versus the page's first-render time on CI; whether the scene can be skipped or lightened under test; splitting the browser tests into their own job so the node tests stay fast; raising `timeout-minutes` only as a last resort. Keep the coverage: do not delete criteria.

## Acceptance criteria

- [ ] A written finding in the handoff: the measured cause, with timings from CI logs (not only the hypothesis)
- [ ] The Tally browser tests plus `smoke:ui` run under half their current time on CI, or in a separate job that does not gate the fast tests
- [ ] Ten consecutive CI runs on the branch (or a documented equivalent such as a repeat loop in CI) with no click timeout or cancellation
- [ ] No test removed or loosened; every `tally-expand` criterion still has a test
- [ ] Any `.github/workflows` change goes through the security cell (CI config is gated)

## Comments

- **orchestrator, 2026-10-01:** Filed on the user's ask to log the CI failures for investigation. Incident row appended to usage.jsonl.
- **qa, 2026-10-01:** QA pass: npm test 1633/0 fail/0 skipped, smoke:ui 6/6, tally-expand 18/18. No assertion or timeout weakened; nothing reads pixels; smoke --url and station-hues-live still render. Criterion 3 (ten CI runs) open until PR exists, for orchestrator.
