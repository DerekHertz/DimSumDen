# den-v1/08 security review

```json
{
  "ticket": "den-v1/08-remove-market-scene",
  "cell": "security",
  "current_step": "Security pass on feat/08-remove-market-scene @ 29875f1. No critical, high or medium findings; one low note. Verdict written to the ticket.",
  "artifacts": [
    "branch feat/08-remove-market-scene @ 29875f1"
  ],
  "decisions": [
    "Risk-check hit on apps/ui/reachability.test.mjs:155 (execFileSync git ls-files) is a false positive: fixed argv array, no shell, fixed cwd (repo root), no untrusted input.",
    "gitleaks over origin/main..29875f1: 4 commits scanned, no leaks.",
    "No dependency, package.json, lockfile or .github change, so no audit or CI review needed.",
    "Diff is deletions (market scene, glbs, tests) plus test and doc edits. Dev-server bind test still asserts 127.0.0.1-only; only its probe URL changed. Removing dev-scene.html/mjs shrinks the served surface."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Orchestrator: open PR and merge on green CI (relay autonomy).",
      "owner": "orchestrator"
    }
  ]
}
```

## Findings

- apps/ui/reachability.test.mjs:155, low (informational): `execFileSync("git", [...])` in a test; argv is constant, no shell. No action.
- apps/ui/reachability.test.mjs:49, low (informational): the reference-scanning regex only reads repo files with `readFileSync`; no path derived from external input. No action.

## Verdict

Security pass.
