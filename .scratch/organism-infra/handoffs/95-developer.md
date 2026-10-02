# Handoff: organism-infra/95 developer (batch J)

## State

```json
{
  "ticket": "organism-infra/95-context-size-gate-counts-binaries",
  "cell": "developer",
  "current_step": "Done on feat/context-gate-batchJ (431728d, one commit on tests 4419779). scripts/dispatch-context.mjs now drops binary files (known extension, or a NUL in the first 8 KB) from the listing, so the size gate and the secret scan see text only. Full npm test: 1657 pass, 0 fail. All [95] tests green. Criterion 4 measured: no more 'root over 5 MB eligible', but see the secret-in-root finding.",
  "artifacts": [
    "scripts/dispatch-context.mjs (isBinary, BINARY_EXTS, listing filter)",
    "scripts/jg.mjs"
  ],
  "decisions": [
    "Binary exclusion lives in the listing (one filter feeds the size check and the secret scan), not in statBytes, so a 100 MB .blend is also never read as utf8 by the secret scan. A missing or unreadable file is treated as not binary (callers already skip it).",
    "jg exposes no eligible-byte count, so I used the ticket's fallback: extension list plus NUL sniff. The 5 MB cap and the 'root over 5 MB eligible' string are unchanged."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Decide on the secret-in-root finding below: with the size gate fixed, this repo still gets no start-here context.",
      "owner": "orchestrator"
    }
  ]
}
```

## Criterion 4: measured against this repo (worktree at 431728d, a code ticket)

- Eligible text: 309 files, 1,977,189 bytes. Cap 5,242,880, so headroom is 3,265,691 bytes (about 3.1 MB). The orchestrator's earlier 4.54 MB figure counted more than text (it excluded by extension only); NUL-sniffing removes about 2.5 MB more. The headroom is comfortable.
- Result: `skipped` is null, so the size skip is gone.
- But the result is `fallback: "secret-in-root"`. Now that the scan reaches real files, six test files trip `hasSecret` on their fake-secret fixtures: scripts/jev-advisory-cli.test.mjs, jev-advisory.test.mjs, jev-hardening.test.mjs, jev-wake-prelude.test.mjs, risk-check.test.mjs, usage-provider.test.mjs. So jg still does not run on this repo. This is outside the ticket (the secret scan behaving as before is criterion 3) and I did not change it. Options for a follow-up ticket: have the root scan ignore `*.test.mjs` (jg would still send them though), or make the fixtures not match (build the fake key at runtime), or accept fixtures with a documented allowlist. The orchestrator should file it.

## Criterion map

1. Under 5 MB text plus over 5 MB binary: "[95] AC1" (library and CLI) pass.
2. Over 5 MB text still skipped: "[95] AC2" passes.
3. Binaries never sent, secret scan as before: existing tests and "[95] AC3" pass.
4. Measured above.
