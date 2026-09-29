# 13 developer handoff

Branch: feat/dimsumden-ui-v0-13-e2e-smoke (commit 8d3c818, on qa's tests d2e421e). Full `npm test`: 655 pass, 0 fail.

```json
{
  "ticket": "dimsumden-ui-v0/13",
  "cell": "developer",
  "mode": null,
  "current_step": "implemented; smoke:ui and --url tests green; in-review",
  "artifacts": ["feat/dimsumden-ui-v0-13-e2e-smoke @ 8d3c818", "apps/ci-cd/smoke-ui.mjs", "apps/ci-cd/smoke.mjs", "package.json"],
  "decisions": [
    "smoke.mjs gained repeatable --url <absolute-url>: loads as given, starts no repo dev server.",
    "smoke:ui reuses apps/bridge/bridge-fixture.mjs (test helper) as the fixture board; it drops the pending merge request on fx/04-review so Approve is live.",
    "Expected chip count (6) and queue head (02, 07, 08) are literals worked out from the fixture, not recomputed.",
    "No .github/workflows edit: `npm test` already runs smoke-ui.test.mjs, which runs smoke:ui, and CI already installs Chromium."
  ],
  "failures": [],
  "pending": [{"item": "qa verify, then security review; note smoke-ui.mjs imports a test helper from apps/bridge", "owner": "qa"}]
}
```

## Notes
- Checks: load (via smoke.mjs --url), scene chips, queue order, chart, approve round trip (asserts requests.jsonl gets a merge-approve row and the card shows pending). Non-zero exit if any prints FAIL.
- Not injected: a failing content check of smoke:ui itself was not exercised; only the exit-code logic is by reading.
- Skipped a separate /code-review pass (small change); tests all green.
