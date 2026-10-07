# 183 security handoff

```json
{
  "ticket": "organism-infra/183-ci-playwright-install-hang",
  "cell": "security",
  "current_step": "Security pass on 309ab8e: ci.yml and ci-workflow.test.mjs reviewed, gitleaks clean, actions/cache pin verified.",
  "artifacts": [
    ".github/workflows/ci.yml",
    "scripts/ci-workflow.test.mjs"
  ],
  "decisions": [
    {
      "decision": "Security pass; no blocking findings"
    }
  ],
  "failures": [],
  "pending": []
}
```

## Verdict
Security pass. No new dependency (package.json and lockfile untouched).

## Checks
- gitleaks detect over 199ca45..309ab8e: 1 commit, no leaks.
- actions/cache pinned to 55cc8345863c7cc4c66a329aec7e433d2d1c52a9; `gh api` confirms it is the v6.1.0 tag commit (matches the comment).
- permissions stay least-privilege (contents: read); no pull_request_target; no secrets added to the test job.
- Cache key playwright-OS-version comes from package-lock.json, not attacker text; PR caches are branch-scoped, and fork PRs get read-only cache, so no poisoning path to main.
- Install loop: no untrusted input; errexit-safe (`cmd && exit 0` in a list); per-attempt timeout 180s with -k, step timeout 8 min.

## Comments (non-blocking)
- ci.yml:~43 low: removing --with-deps means the Chromium fallback may lack system libs if Chrome is ever absent from ubuntu-latest; smoke prefers Chrome, so acceptable. A real CI run is the only proof of cache hit/miss and browser discovery.
- ci.yml:~38 low: cache is saved only if the job succeeds, so a failing test run will not warm it.
