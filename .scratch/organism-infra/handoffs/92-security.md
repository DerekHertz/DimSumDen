# Security review: organism-infra/92 (batch J with 95)

Verdict: Security pass. Branch feat/context-gate-batchJ at 431728d; one review covers both tickets. Full finding list is in the 95 handoff (95-security.md).

```json
{
  "ticket": "organism-infra/92-dispatch-context-hardening",
  "cell": "security",
  "current_step": "Security review done: pass, no critical or high findings.",
  "artifacts": ["scripts/dispatch-context.mjs", "scripts/jg.mjs", "scripts/dispatch-context.test.mjs", "scripts/jg.test.mjs"],
  "decisions": [
    "Scanning untracked non-ignored files (git ls-files --cached --others --exclude-standard) widens secret-in-root coverage; board dirs stay excluded.",
    "Write-by-rename removes the partial-file read race on the cached context file.",
    "jg trusted flags are now an allowlist instead of a denylist.",
    "gitleaks over origin/main..431728d: no leaks. Tests 53/53 pass."
  ],
  "failures": [],
  "pending": []
}
```

## Findings (low, non-blocking)

- scripts/dispatch-context.mjs:86-90, low: untracked symlink to a FIFO or device could hang the open (DoS only).
- scripts/dispatch-context.mjs:205-215, low: temp file name is pid-predictable and written without the "wx" flag; same-user only.
- scripts/dispatch-context.mjs:25-45, low: binary heuristic vs jg's own binary detection (see 95 handoff).
