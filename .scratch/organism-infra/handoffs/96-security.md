# 96 security review

```json
{
  "ticket": "organism-infra/96-test-fixture-fake-keys-at-runtime",
  "cell": "security",
  "current_step": "Security pass at 1d77c40. Diff vs origin/main is six test-fixture one-liners plus one new test; no findings.",
  "artifacts": ["scripts/test-fixture-secrets.test.mjs"],
  "decisions": [
    "risk-check 'secrets handling' hits on risk-check.test.mjs and usage-provider.test.mjs are false positives: both are fake literals split at runtime.",
    "gitleaks detect --log-opts=origin/main..1d77c40: 1 commit scanned, no leaks.",
    "Secret scan (scripts/exposure.mjs, scripts/dispatch-context.mjs) is untouched; the new test imports the same hasSecret the dispatcher uses.",
    "No dependency, lockfile, .github or .claude changes."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Orchestrator: open PR and merge on green CI. AC4 is tracked in organism-infra/97.",
      "owner": "orchestrator"
    }
  ]
}
```

## Findings

None. No file:line findings at any severity.

- Diff is limited to fake-key string literals reassembled at runtime (`"sk" + "-test-..."`, `.join("-")`). Values and assertions are unchanged.
- No real credentials, no shell-out, path, network or UI changes.
- Review note: the split `sk_live_` fixture in `scripts/risk-check.test.mjs` is intentional so risk-check still detects the assembled value at runtime. The test covering it still passes per qa.
