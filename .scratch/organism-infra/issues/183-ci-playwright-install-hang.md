# 183: CI's Playwright install step hangs until the job times out

**Type:** task (owner: security; CI workflow)

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** resolved

**Serves:** Every merge on the north-star path. A hung install blocks the merge gate for 15 minutes per attempt.

## What happened

PR #179 (batch D), run 37678811552, `test` job: the step `npx playwright install --with-deps chromium` (`.github/workflows/*.yml` line ~30) hung until the job was cancelled at 15 minutes (20:01→20:16 UTC, 2026-10-07). The re-run hung the same way (started 20:30:35, still in that step at 20:39). The same step took 18–66 s on the three `main` runs just before it (19:36–19:59 UTC). The PR changes no dependencies or workflows. `--with-deps` also runs apt-get for system libraries, so the stall could be the apt mirror or the Playwright CDN.

## What to build

Make the step fail fast and recover instead of eating the job's timeout:
- a `timeout-minutes` on the install step, with one retry;
- cache `~/.cache/ms-playwright` keyed on the Playwright version from `package-lock.json`;
- consider whether the smoke check's fallback browser needs `--with-deps` on `ubuntu-latest`, which already ships Chrome.

## Acceptance criteria

- [ ] A stalled install fails the step within a few minutes (bounded by `timeout-minutes`), not the whole job's timeout.
- [ ] With a warm cache, the step skips the browser download.
- [ ] `npm test` still finds a browser for the smoke checks on CI.

## Comments

- **Created (orchestrator, 2026-10-07):** User, 2026-10-07: re-run once; if it hangs again, file a ticket for security. It hung again.
- **qa, 2026-10-07:** QA pass (full verify). 2405 tests pass, 0 skipped; ci-workflow.test.mjs 6/6. All 3 criteria mapped; workflow tests are text-level, so cache miss/hit and browser discovery need a real CI run. New actions/cache SHA pin for security. See handoff 183-qa-verify.md.
- **security, 2026-10-07:** Security pass. gitleaks clean; actions/cache SHA verified as v6.1.0; least-privilege permissions kept; no new dependency. Low: ci.yml no --with-deps (Chrome preinstalled, fallback only); cache saved only on job success. See handoff 183-security.md.
