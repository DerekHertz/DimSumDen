# Handoff: organism-infra/134 security

```json
{
  "ticket": "organism-infra/134-os-agnostic-usage-reading",
  "cell": "security",
  "current_step": "Full security review of f36d038 done: Security pass. No critical or high findings; two low notes. gitleaks clean on origin/main..f36d038 (3 commits). Re-ran scripts/usage-keychain.test.mjs: 18/18 green.",
  "artifacts": [
    "scripts/usage-token.mjs",
    "scripts/usage-claude.mjs"
  ],
  "decisions": [
    "Credential handling: the Keychain payload (access token, refreshToken, mcpOAuth map) stays in a local variable; only claudeAiOauth.accessToken is extracted, the rest is discarded. JSON.parse errors are caught without using e.message, so payload text cannot leak into a diagnostic. Failure reasons are fixed strings plus errno names or the exit status number.",
    "The token goes only into the Authorization header of a fetch to the hard-coded https://api.anthropic.com URL. Not in argv (argv is the fixed service name), not in env, not logged. fetch errors print only e.name.",
    "Child process: spawnSync with an argument array (no shell), stdin ignored, 5 s default timeout, SIGKILL on timeout so the child is reaped. No injection surface: no untrusted text reaches argv or a path.",
    "USAGE_VERBOSE prints only the source label (credentials file or keychain), never a value. Acceptable.",
    "Cloud-session behaviour change (credentials file without token now gets the estimate instead of exit 1) is harmless: the estimate reads local transcripts and exposes no credential.",
    "No dependency, lockfile, or .github change. The CLAUDE.md and usage-watch SKILL.md wording edits are the user-applied gated patch, wording only.",
    "LOW 1, scripts/usage-token.mjs:38 and :42: `security` is resolved through PATH, and USAGE_SECURITY_BIN lets the environment choose the binary. Anyone who controls the process environment already has code execution as this user, so this adds no privilege. Optional hardening: default to the absolute /usr/bin/security. Non-blocking.",
    "LOW 2, scripts/usage-token.mjs:42: `security find-generic-password -w` puts the whole item in this process's memory (including refreshToken and other servers' tokens), which is inherent to the Keychain API. It is not persisted or printed. Non-blocking."
  ],
  "failures": [],
  "pending": []
}
```

## Verdict

Security pass.

## Findings

- scripts/usage-token.mjs:38,42, low: bare `security` via PATH plus the USAGE_SECURITY_BIN override. Needs control of the environment, so no escalation. Consider the absolute path /usr/bin/security.
- scripts/usage-token.mjs:42, low: the full Keychain item is held in memory briefly; only accessToken is kept and nothing is printed or stored.

## Environment issues

None.
