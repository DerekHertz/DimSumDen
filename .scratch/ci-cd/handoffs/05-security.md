# Handoff: ci-cd/05 security review (plus light qa verify)

Verdict: Security pass. Branch `ci-cd/05-cloud-browser-tests` at 36a0e42. Reviewed `git diff origin/main...36a0e42` (6 files, +94/-2). A two-dot diff shows herald/draft-check deletions; that is main being ahead of the branch base, not branch changes.

```json
{
  "ticket": "ci-cd/05-cloud-browser-tests",
  "cell": "security",
  "current_step": "security review complete, verdict pass, ready for orchestrator merge proposal",
  "artifacts": [
    "apps/ci-cd/launch-options.mjs",
    "apps/ci-cd/smoke.mjs",
    "apps/ci-cd/smoke-ui.mjs",
    "apps/ci-cd/launch-options.test.mjs",
    "apps/ci-cd/smoke.test.mjs",
    "docs/agents/cloud-sessions.md"
  ],
  "decisions": [
    "Security pass: no critical or high findings",
    "PW_CHROMIUM_PATH adds no new privilege: whoever controls the env or the workflow already executes arbitrary code (same class as NODE_OPTIONS or LD_PRELOAD)",
    "Unset or empty behaviour for CI is unchanged; ci.yml does not set the variable and the branch does not touch .github",
    "qa specify tests 18a4b1a not weakened: launch-options.test.mjs and smoke.test.mjs are byte-identical between 18a4b1a and a546165 (developer commit)",
    "qa helper commit 36a0e42 only adds a copyFileSync of launch-options.mjs in two temp-dir helpers in smoke.test.mjs (+8 lines, no assertion changes)"
  ],
  "failures": [
    "gitleaks not installed (not at ~/.local/bin or on PATH): fell back to a pattern scan of the added lines in origin/main..36a0e42, 0 hits. Weaker than gitleaks; re-run when installed.",
    "In my fresh worktree smoke.test.mjs test 11 (clean dev page) fails with 'playwright not installed' because the worktree has no Playwright browser deps. Environmental, matches qa's 813/814 note (their failure was a different one, smoke:ui font cert error); I did not run the full suite."
  ],
  "pending": [
    {"item": "Propose merge of ci-cd/05 to main (user gate)", "owner": "orchestrator"},
    {"item": "Install gitleaks so the secret-scan fallback can be retired", "owner": "user"},
    {"item": "Optional: set PW_CHROMIUM_PATH in cloud environment setup as documented", "owner": "user"}
  ]
}
```

## Findings

1. `apps/ci-cd/launch-options.mjs:5-6`, low. `PW_CHROMIUM_PATH` is an arbitrary executable path from env, passed to Playwright as `executablePath`. Who controls env: locally, the developer's own shell (already full code execution as that user); in GitHub Actions, only the workflow file or repo/org variables, which security reviews and which can already run any `run:` step. No workflow sets it today. No injection path: the value is passed as an argv path by Playwright, not through a shell. Accepted; no code change needed. Optional hardening, not required: none worthwhile, an existence or allowlist check would only add friction.
2. `apps/ci-cd/launch-options.mjs:7`, low. `--enable-unsafe-swiftshader` weakens the browser's GPU-process hardening for WebGL. Only applied when the env var is set (cloud sessions), and the browser only loads the local dev server, the local bridge on 127.0.0.1, or fixtures. `smoke --url` can load any URL an operator passes, so do not point it at untrusted external pages with the variable set. No `--no-sandbox` or `--disable-web-security` added (good). Documented flags match the ticket.
3. `docs/agents/cloud-sessions.md:8`, low (informational). The doc shows a fixed path under `/opt/pw-browsers`; fine. Suggest never setting it in a workflow that runs fork PR code with secrets (none does today).

## Checks

- Dependencies: package.json and package-lock.json untouched, no new deps, no install scripts.
- CI/CD: `.github/` untouched, so no pinning, permissions, or `pull_request_target` changes to review.
- Secrets: pattern-scan fallback, 0 hits (gitleaks missing, see failures).
- Unset behaviour: `buildLaunchOptions(channel, {})` returns `{channel}` or `{}`, identical to the old inline expression; empty string counts as unset. Both launchers keep the chrome, msedge, bundled probe loop.
- Tests I ran here: `node --test apps/ci-cd/launch-options.test.mjs apps/ci-cd/smoke.test.mjs`: 11/12 pass; the one failure is the missing-playwright environment noted above.
- Acceptance: box 2 (unit test on builder) and box 3 (setup line documented) verified. Box 1 (no browser-launch failures with variable set) rests on qa's run (813/814; the one failure is a fonts.googleapis.com proxy cert error, not a launch failure); I did not re-run it.
