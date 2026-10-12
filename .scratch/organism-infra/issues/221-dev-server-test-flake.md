# 221: `dev-server.test.mjs` "serves a .mjs file" fails now and then in a full run

**Type:** bug

**Priority:** P3

**Class:** pipeline

**Blocked by:** None

**Status:** ready-for-agent

**Serves:** Retro 2026-10-11 (organism-infra/220 relay). Testbed friction: a red full run on a branch that does not touch `apps/` costs a re-run and casts doubt on a verify.

## What to build

`apps/ci-cd/dev-server.test.mjs`, test "serves a .mjs file", failed once in a full `npm test` run on the organism-infra/220 branch with "dev server exited before it answered" (exit code 1). It passed when run alone and in the next full run. The branch did not touch `apps/`.

Find why the dev server child exits before it answers when the full suite runs (a port clash with another test, a startup race, or load are the first things to check) and fix the cause. Do not fix it with a retry or a longer timeout unless the cause is shown to be startup time.

## Acceptance criteria

- [ ] The cause is named on this ticket, with the evidence (the child's stderr or exit reason from a failing run).
- [ ] The test passes in 20 full `npm test` runs in a row; the run count and result are recorded here.
- [ ] No other test's behaviour changes.

## Comments

- 2026-10-11, orchestrator: filed from the retro on the user's yes. One occurrence so far (incident row 2026-10-12T01:19:23Z). Other parked flake tickets, for different tests: organism-infra/135, 149, 206.
