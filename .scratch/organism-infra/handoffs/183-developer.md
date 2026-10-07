# 183 developer handoff

Status: in-review. Branch feat/183-ci-playwright-install-hang.

## What changed
- `.github/workflows/ci.yml` (test job): removed `--with-deps` (apt-get is the suspected stall); the install step now has `timeout-minutes: 8` and a two-attempt loop of `timeout -k 10 180 npx playwright install chromium`; added a "Read Playwright version" step (from package-lock.json) and an `actions/cache@v6.1.0` step (SHA-pinned, `~/.cache/ms-playwright`, key `playwright-<os>-<version>`); the install step is skipped on `cache-hit`.
- `scripts/ci-workflow.test.mjs`: 6 text-level tests on the workflow (timeout, retry, no `--with-deps`, cache keyed on lock version, skip on hit, ordering before `npm test`).

## Notes for security / orchestrator
- New action dependency: `actions/cache` pinned to 55cc8345863c7cc4c66a329aec7e433d2d1c52a9 (v6.1.0, resolved via gh api). Security should confirm.
- Browser for smoke on CI: smoke.mjs and smoke-ui.mjs try system chrome, then msedge, then bundled Chromium. ubuntu-latest ships Chrome, so the bundled install is only a fallback. Without `--with-deps` the bundled Chromium may lack system libs if it were ever the one used; this is unverified until CI runs.
- Not verified locally: the workflow itself (needs a real CI run on the PR to confirm cache miss then hit, and that smoke tests still find a browser).
- `npm test`: 2405 pass, 0 fail (scout run).

```json
{
  "ticket": "organism-infra/183-ci-playwright-install-hang",
  "cell": "developer",
  "current_step": "Committed 309ab8e on feat/183-ci-playwright-install-hang; npm test green (2405 pass); awaiting qa verify and a real CI run",
  "artifacts": [
    ".github/workflows/ci.yml",
    "scripts/ci-workflow.test.mjs"
  ],
  "decisions": [
    "Dropped --with-deps; ubuntu-latest ships Chrome which smoke tries first",
    "Retry via shell loop with timeout per attempt plus step timeout-minutes 8",
    "Cache key from package-lock Playwright version via step output"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Confirm actions/cache SHA pin and watch the PR CI run for cache miss then hit",
      "owner": "security"
    }
  ]
}
```
