# Handoff: security re-review, mods-trial/01

```json
{
  "ticket": "mods-trial/01-sleep-chain-guard-mod",
  "cell": "security",
  "current_step": "Security bounce on 5f488ae (fix round over eb78b20). The medium redaction finding is fixed, but gitleaks flags the new test fixture, so the required CI secret scan would go red.",
  "artifacts": [
    "mods/sleep-guard/hooks/sleep-guard.mjs",
    "scripts/mods-sleep-guard.test.mjs",
    ".gitleaks.toml",
    "gitleaks eb78b20..5f488ae: 1 finding (curl-auth-header), scripts/mods-sleep-guard.test.mjs:191, fake fixture value",
    "node --test scripts/mods-sleep-guard.test.mjs scripts/root-secret-scan.test.mjs: 67/67 pass"
  ],
  "decisions": [
    "BOUNCE (high, process): scripts/mods-sleep-guard.test.mjs:191 trips the gitleaks default rule curl-auth-header (commit 5f488ae). The value is a made-up fixture, not a real secret, but .github/workflows/ci.yml runs gitleaks-action over the PR commit range with .gitleaks.toml, so the required secret-scan check fails. Deleting the line in a later commit does not help, since the range scan still sees 5f488ae. Fix: add '''^scripts/mods-sleep-guard\\.test\\.mjs$''' to the [allowlist] paths in .gitleaks.toml, following the existing risk-check.test.mjs precedent. A path allowlist covers every commit in the range. Then re-run gitleaks detect --log-opts=origin/main..<sha> and confirm it is clean. Alternative: build the whole curl line at runtime so the source has no literal Authorization: Bearer header.",
    "Original medium finding is fixed: redact() runs before the 200-char slice, and 8 tests cover env assignment, bearer, basic, token flag (space and =), url credentials, quoted env value, known token shape. Block decision, exit code and stderr are unchanged.",
    "Low: sleep-guard.mjs:172-186 the secret-flag regex backtracks quadratically on a long run of dashes (50 KB of '-' took about 3.8 s to redact). It only runs on a blocked command and the input is the user's or agent's own command, so this is self-inflicted. Optionally cap the command length before redact().",
    "Low (accepted, known by dev): a bare high-entropy string with no marker is not redacted; redaction is best effort.",
    "Pass: no dependency or lockfile change, no .github change, no network listener, board CLI still spawned with an argv array."
  ],
  "failures": [
    "gitleaks detect eb78b20..5f488ae exited 1 with one leak; re-ran with --redact and a JSON report in the scratchpad to read the location without printing the value."
  ],
  "pending": [
    {
      "item": "Allowlist scripts/mods-sleep-guard.test.mjs in .gitleaks.toml (or restructure the fixture), then re-run gitleaks on origin/main..<sha> and npm test. Optional: cap command length before redact().",
      "owner": "developer"
    }
  ]
}
```
