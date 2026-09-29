# Handoff: ci-cd/05 developer

Branch ci-cd/05-cloud-browser-tests (a546165), pushed. Status: in-review, but 2 of qa's tests conflict with the contract (see failures).

```json
{
  "ticket": "ci-cd/05-cloud-browser-tests",
  "cell": "developer",
  "current_step": "implemented; commit a546165 pushed; in-review with a qa test conflict",
  "artifacts": [
    "apps/ci-cd/launch-options.mjs",
    "apps/ci-cd/smoke.mjs",
    "apps/ci-cd/smoke-ui.mjs",
    "docs/agents/cloud-sessions.md"
  ],
  "decisions": [
    "buildLaunchOptions returns {executablePath, args} when PW_CHROMIUM_PATH is non-empty, else channel ? {channel} : {}",
    "Static import in both launchers, as qa's regex test requires",
    "docs/agents/cloud-sessions.md did not exist; created it with the export line"
  ],
  "failures": [
    "npm test plain: 807 pass, 7 fail (24,25,26,27,28,30,31). All browser-launch or related.",
    "npm test with PW_CHROMIUM_PATH: 811 pass, 3 fail (27,28,30). 0 browser-launch failures among smoke --url and smoke tests 24-26,31.",
    "Tests 28 and 30 (smoke.test.mjs) copy only smoke.mjs and dev-server.mjs to a temp dir; the required static import of ./launch-options.mjs then fails with ERR_MODULE_NOT_FOUND. They contradict the launch-options contract. Fix belongs to qa: also copy launch-options.mjs in those two helpers (lines ~70 and ~184). Not edited by me.",
    "Test 27 (smoke:ui): browser launches and 4 checks PASS, but the load check FAILs on a fonts.googleapis.com request, net::ERR_CERT_AUTHORITY_INVALID (sandbox proxy CA). Environment, not launch."
  ],
  "pending": [
    {"item": "Update the two temp-dir copy helpers in smoke.test.mjs to include launch-options.mjs, then re-verify: expect 28 and 30 to pass", "owner": "qa"},
    {"item": "Decide on smoke:ui font cert error in cloud (NODE_EXTRA_CA_CERTS or bypassing the external font request)", "owner": "orchestrator"}
  ]
}
```
