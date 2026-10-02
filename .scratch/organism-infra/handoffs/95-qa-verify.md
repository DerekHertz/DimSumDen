# Handoff: organism-infra/95 qa verify (batch J, full verify)

## State

```json
{
  "ticket": "organism-infra/95-context-size-gate-counts-binaries",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Full verify of feat/context-gate-batchJ at 431728d: QA pass. Scout ran npm test (1657 pass, 0 fail, 0 skipped, 0 todo). Test files are unchanged between the specify commit 4419779 and 431728d. Every criterion maps to a passing test, or to a measurement (criterion 4).",
  "artifacts": [
    "scripts/dispatch-context.test.mjs ([95] AC1 x2, AC2, AC3)",
    "scripts/dispatch-context.mjs (isBinary, BINARY_EXTS, listing filter)"
  ],
  "decisions": [
    "QA pass. Criterion 4 is met as worded (no more 'root over 5 MB eligible') but jg still does not run on this repo because of secret-in-root, see pending."
  ],
  "failures": [],
  "pending": [
    {
      "item": "File a follow-up ticket: with the size gate fixed, the root secret scan hits fake-secret fixtures in six test files (scripts/jev-advisory-cli.test.mjs, jev-advisory.test.mjs, jev-hardening.test.mjs, jev-wake-prelude.test.mjs, risk-check.test.mjs, usage-provider.test.mjs), so dispatch-context still falls back with secret-in-root and no cell gets start-here context. Outside this ticket (criterion 3 requires the scan to behave as before).",
      "owner": "orchestrator"
    }
  ]
}
```

## Criterion map

1. Under 5 MB text plus over 5 MB binary is not skipped, jg called: "[95] AC1" library test and "[95] AC1: the same holds end to end through the CLI". Pass.
2. Over 5 MB text still skipped with the reason string: "[95] AC2". Pass.
3. Binaries never sent, scan as before: existing tests green, plus "[95] AC3" (big binary beside a secret text file still gives secret-in-root). Pass.
4. Run against this repo: I re-measured independently with a throwaway script (git ls-files --cached --others --exclude-standard, minus .scratch/ and .claude/, minus NUL-in-first-8KB files): 378 listed files, 177,354,116 bytes total, 309 text files, 1,977,189 eligible bytes, 69 NUL files. This matches the developer. Cap 5,242,880, so headroom is 3,265,691 bytes (about 3.1 MB). The size skip is gone. Measured, not an automated test; the CLI run itself was not repeated, to avoid writing a usage row.

## Checks

- Test diff 4419779..431728d touches no test file: no assertion removed or loosened.
- Tests drive the default size check on real git repos with real files, not mocks.
- Minor gap, not a bounce: no test isolates the NUL sniff from the extension list (fixtures carry both), which the ticket allows either way.
- Diff outside ticket scope: none for 95 (scripts/jg.mjs and scripts/jg.test.mjs belong to 92 in the same batch).
