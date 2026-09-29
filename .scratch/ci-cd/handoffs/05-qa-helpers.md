# Handoff: ci-cd/05 qa specify fix round (helpers)

```json
{
  "ticket": "ci-cd/05-cloud-browser-tests",
  "cell": "qa",
  "mode": "specify",
  "current_step": "fix round done: temp-dir helpers in apps/ci-cd/smoke.test.mjs now also copy launch-options.mjs",
  "artifacts": ["apps/ci-cd/smoke.test.mjs", "branch ci-cd/05-cloud-browser-tests"],
  "decisions": ["Changed only the two helpers (makeWorktreeWithoutDeps, makeWorktreeWithMissingBrowserBinary); no assertions touched."],
  "failures": ["Test 27 (smoke:ui) fails: fonts.googleapis.com net::ERR_CERT_AUTHORITY_INVALID from sandbox proxy. Environmental, not worked around."],
  "pending": [{"item": "Re-verify with network that trusts fonts.googleapis.com (test 27)", "owner": "qa"}]
}
```

Full npm test with PW_CHROMIUM_PATH: 814 tests, 813 pass, 1 fail (27), 0 skipped, 0 cancelled.
