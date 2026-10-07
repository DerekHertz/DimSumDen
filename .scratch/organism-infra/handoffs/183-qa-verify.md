# 183 qa verify (full)

Verdict: QA pass. Branch feat/183-ci-playwright-install-hang at 309ab8e. No qa specify ran for this ticket, so this is a full verify; the developer wrote the tests.

## Checks
- `npm test` (scout run): 2405 pass, 0 fail, 0 skipped, exit 0. `scripts/ci-workflow.test.mjs`: 6 of 6 pass.
- No qa specify tests exist, so none were deleted or weakened.
- Diff vs base touches only `.github/workflows/ci.yml` and `scripts/ci-workflow.test.mjs`. Both are in scope.
- `package-lock.json` lookup `packages['node_modules/playwright'].version` returns 1.63.0, so the cache key resolves.

## Criterion map
1. Stalled install fails within minutes: tests "has its own timeout-minutes ... <= 10" and "retries once" (step timeout-minutes 8; two attempts of `timeout -k 10 180`).
2. Warm cache skips the download: tests "browser dir is cached, keyed on the Playwright version" and "a warm cache skips the install step" (`if: cache-hit != 'true'`).
3. `npm test` still finds a browser: smoke.mjs and smoke-ui.mjs try chrome, msedge, then bundled Chromium (checked at apps/ci-cd/smoke.mjs:40 and smoke-ui.mjs:60). Tests assert no `--with-deps` and that cache and install come before `npm test`. Whether CI really finds a browser needs a real run.

## Notes (not bounces)
- The tests read the workflow as text, so they check its structure, not how it behaves. Criteria 1 and 2 (real timeout, cache miss then hit) and 3 only get proven by CI runs on the PR. Treat the first PR run as the miss, and a re-run as the hit.
- New action dependency actions/cache pinned to 55cc8345863c7cc4c66a329aec7e433d2d1c52a9 (v6.1.0). Security must confirm it, as the developer handoff says.
- Without `--with-deps` the bundled Chromium may lack system libs if it is ever the browser used; chrome on ubuntu-latest should come first.

```json
{
  "ticket": "organism-infra/183-ci-playwright-install-hang",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Full verify done: QA pass. 2405 tests pass, 0 skipped; every criterion mapped; awaiting security (CI file and new action dependency) and a real CI run",
  "artifacts": [
    ".github/workflows/ci.yml",
    "scripts/ci-workflow.test.mjs"
  ],
  "decisions": [
    "Pass: text-level workflow tests cover criteria 1 and 2 structurally; criterion 3 rests on the smoke browser fallback order plus a real CI run"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Confirm actions/cache SHA pin; watch PR CI for cache miss then hit and smoke finding a browser",
      "owner": "security"
    }
  ]
}
```
