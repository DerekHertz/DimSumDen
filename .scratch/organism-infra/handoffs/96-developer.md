# 96 developer handoff

Branch `feat/fixture-keys96`, commit `1d77c40`, based on `f07555f`.

```json
{
  "ticket": "organism-infra/96-test-fixture-fake-keys-at-runtime",
  "cell": "developer",
  "current_step": "Done at 1d77c40 on feat/fixture-keys96. Six fixtures build their fake keys at runtime; new scripts/test-fixture-secrets.test.mjs scans the six files with hasSecret (red before, green after). npm test: 1663 pass, 0 fail. AC4 only partly met: the secret scan now passes, but dispatch-context still falls back with jg-exit-1 (jg resource_limit on the full repo).",
  "artifacts": [
    {"path": "scripts/test-fixture-secrets.test.mjs", "note": "new: 6 tests, one per file, assert hasSecret(source) is false"},
    {"path": "scripts/jev-advisory-cli.test.mjs", "note": "KEY = \"sk\" + \"-test-...\""},
    {"path": "scripts/jev-advisory.test.mjs", "note": "same"},
    {"path": "scripts/jev-hardening.test.mjs", "note": "same"},
    {"path": "scripts/jev-wake-prelude.test.mjs", "note": "same"},
    {"path": "scripts/risk-check.test.mjs", "note": "sk_live_ fixture split across a concatenation (the string value is unchanged)"},
    {"path": "scripts/usage-provider.test.mjs", "note": "SECRET built with an array join (same value)"}
  ],
  "decisions": [
    "Each fake key keeps the exact same runtime value, so all assertions are untouched.",
    "Probed hasSecret per pattern: only 7 hits in 6 files (4 sk- keys, the sk_live_ apiKey line, the SECRET constant). Fixed exactly those.",
    "exposure.mjs and dispatch-context.mjs are unchanged."
  ],
  "failures": [
    "AC4: node scripts/dispatch-context.mjs --ticket organism-infra/95-context-size-gate-counts-binaries --root <worktree> and the same for organism-infra/92-dispatch-context-hardening return {path:null, skipped:null, fallback:\"jg-exit-1\"}. The secret scan (which runs before jg) now passes, since the fallback is no longer secret-in-root. A direct jg call on the full worktree prints 'discovery incomplete' with Issue \"resource_limit\": 1 and exits non-zero. The same jg call on the scripts/ subdirectory succeeds, and jg doctor succeeds. So the jg service or repo size is the remaining blocker, not secrets."
  ],
  "pending": [
    {"item": "Decide AC4: the jg resource_limit on the full repo is outside this ticket. Open a ticket (or re-run later if it is a transient provider limit) so dispatch-context returns a non-null path.", "owner": "orchestrator"},
    {"item": "qa verify / risk-check as usual", "owner": "qa"}
  ]
}
```

## Side effects

The two dispatch-context runs appended two `kind:"jg"` rows (fallback jg-exit-1) to the main checkout's `.scratch/usage.jsonl`. No `.scratch/_context` file was written.
