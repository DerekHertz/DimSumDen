# Handoff: organism-infra/92 qa specify (batch J)

## State

```json
{
  "ticket": "organism-infra/92-dispatch-context-hardening",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Batch J tests committed on tests/context-gate-batchJ (4419779, base 11722e7). Four [92] tests fail for the missing feature (untracked secret not scanned, listing lacks untracked files, in-place write instead of rename, denylist lets --verbose through); one more [92] test (.scratch/ and .claude/ untracked files stay out of the scan) passes now and guards the exclusion.",
  "artifacts": [
    "scripts/dispatch-context.test.mjs (appended blocks tagged [92] and [95])",
    "scripts/jg.test.mjs (appended block tagged [92] AC2)"
  ],
  "decisions": [
    "M1 is tested through the default git passthrough in the fake run, so any equivalent listing works (git ls-files -z --cached --others --exclude-standard). The listing test asserts the files handed to the trackedBytes seam are the tracked plus untracked non-ignored files, with .scratch/ and .claude/ and ignored files out. That treats the size check and the secret scan as sharing one listing, as the ticket comments say.",
    "L1 is tested at runJg: ['--verbose'], ['--include-ignored'], ['--follow-symlinks'] and either order of an allowed flag plus a stranger must reject with e.kind === 'flag' and never call run. ['--max-source-bytes','24576'] stays accepted (existing test). I did not test the '--max-source-bytes=N' form, a bare value, or a non-numeric value: the ticket does not say.",
    "L2 is tested through the CLI with a hard link: after a first run the context file is overwritten with OLD CONTENT and hard-linked elsewhere; a --refresh run must leave the old inode whole (the link still reads OLD CONTENT) while the path holds the new context, and the directory holds only the final file (no leftover temp). An in-place write fails this, rename passes. The temp file must live on the same filesystem (same directory) for rename to work.",
    "main() is not exported, so L2 has no library-level seam; this is a CLI subprocess test."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Add --others --exclude-standard to the git ls-files listing in scripts/dispatch-context.mjs, replace checkTrustedFlags in scripts/jg.mjs with an allowlist of --max-source-bytes (value token allowed), and write the context file to a temp file in the same directory then rename. Never loosen the tests.",
      "owner": "developer"
    }
  ]
}
```

## Criterion-to-test map

1. A secret in an untracked, non-ignored file falls back with `secret-in-root` and never calls jg (`scripts/dispatch-context.test.mjs`):
   - "[92] AC1: a secret in an untracked, non-ignored file falls back with secret-in-root and never calls jg"
   - "[92] AC1: the listing handed to the size check adds untracked files but not ignored ones or the board"
   - "[92] AC1: a secret in an untracked file under .scratch/ or .claude/ stays out of the scan" (guard, passes now)
2. `runJg` with any in-process flag other than `--max-source-bytes` is refused (`scripts/jg.test.mjs`):
   - "[92] AC2: runJg refuses any in-process flag other than --max-source-bytes"
3. The context file is written by rename (`scripts/dispatch-context.test.mjs`):
   - "[92] AC3: --refresh replaces the context file by rename, so a reader of the old file never sees a partial write"

No criterion is human-verified.
