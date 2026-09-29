```json
{
  "ticket": "dimsumden-ui-v0/13",
  "cell": "security",
  "current_step": "security review done: pass, no critical or high findings",
  "artifacts": ["feat/dimsumden-ui-v0-13-e2e-smoke @ 8d3c818 (reviewed, not changed)"],
  "decisions": ["Hand review (no /security-review run); gitleaks ran clean over origin/main..8d3c818"],
  "failures": [],
  "pending": [{"item": "propose merge", "owner": "orchestrator"}]
}
```

# 13 security handoff

Verdict: Security pass.

Scope: apps/ci-cd/smoke-ui.mjs, smoke-ui.test.mjs, smoke.mjs (--url mode), package.json (smoke:ui script only).

Checks:
- Secrets: gitleaks detect over origin/main..8d3c818, 2 commits, no leaks.
- Dependencies: none added; package.json only gains the script. No workflow change.
- Shelling out: smoke-ui.mjs spawns `npm run ui:build` and `node apps/ci-cd/smoke.mjs --url <bridge.url>/` with fixed argv, no shell on Linux (shell only on win32, args still fixed). The URL comes from startBridge, not from external input.
- Network: startBridge({port: 0}) binds 127.0.0.1 (apps/bridge/server.mjs:16, :171) with Host and Origin checks; ephemeral port.
- Board writes: the Approve round trip writes only to a mkdtemp fixture root (bridge-fixture.mjs:57), removed in `finally`. The real board is never touched.
- smoke.mjs --url: loads any URL given on the CLI in headless Chromium. Developer-run tool with argv from the invoker, not agent or web text; no trust boundary crossed.

Findings (non-blocking):
- apps/ci-cd/smoke-ui.mjs:82-86, low: the fixture is created and the requests file edited before the `try`, so a throw there (or a hard kill) leaks a bridge-fx-* dir in the OS temp dir. Cosmetic; move the setup inside the try if convenient.
- apps/ci-cd/smoke.mjs --url, low: no scheme restriction (file:// would load). Only reachable by the local invoker; note if the flag is ever wired to CI input.

Next step: orchestrator proposes the merge (a Pass gate for the user).
