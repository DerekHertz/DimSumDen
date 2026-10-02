# Handoff: organism-infra/92 qa verify (batch J, full verify)

## State

```json
{
  "ticket": "organism-infra/92-dispatch-context-hardening",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Full verify of feat/context-gate-batchJ at 431728d: QA pass. Scout ran npm test (1657 pass, 0 fail, 0 skipped, 0 todo). Test files unchanged since the specify commit 4419779. All three criteria map to passing tests.",
  "artifacts": [
    "scripts/dispatch-context.test.mjs ([92] AC1 x3, AC3)",
    "scripts/jg.test.mjs ([92] AC2)",
    "scripts/dispatch-context.mjs, scripts/jg.mjs"
  ],
  "decisions": [
    "QA pass. See the 95 handoff for the batch finding (secret-in-root on this repo), which is a follow-up and not a 92 defect."
  ],
  "failures": [],
  "pending": []
}
```

## Criterion map

1. Secret in an untracked, non-ignored file gives secret-in-root and jg is never called: three "[92] AC1" tests (untracked secret falls back; listing adds untracked but not ignored or board files; secret under .scratch/ or .claude/ stays out). Pass.
2. runJg refuses any in-process flag other than --max-source-bytes: "[92] AC2" in scripts/jg.test.mjs (five refused flag sets, jg never runs). Existing test for --exclude and --no-ignore still green. Pass.
3. Context file written by rename: "[92] AC3" (a hard link to the old inode keeps its old content after --refresh, and no temp file is left). Pass.

## Checks

- Test diff 4419779..431728d touches no test file.
- Review of src: L1 allowlist also requires a digit-only value and refuses a bare flag. L2 removes the temp file on failure. Neither is covered by a test beyond what is above, and neither is required by the criteria.
- Diff outside ticket scope: none (changes are limited to the four files in the batch).
