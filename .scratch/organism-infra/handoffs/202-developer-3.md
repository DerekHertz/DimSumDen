# 202 developer handoff 3 (bounce fix)

Branch feat/202-conformance-spikes-round-4-fixes, head d6ea72d. Only the two qa-verify bounce items.

## Done
- (a) New test in conformance-round4.test.mjs: "setup guard, S6b: a hook_started event is not a setup failure". Asserts the evidence never names hook_started. Checked red by removing the `spike !== "S6b"` guard at conformance.mjs:485, green with it restored. qa's existing tests are untouched (new test added after the S1/S4b/S8 loop).
- (b) Option chosen: back up and restore, not refuse. compareS6bAllow now reads allowed.txt and the deny target (denied.txt) into backups before the probe and, in the finally, writes the bytes back or removes the file if it was absent. settings.local.json handling is unchanged.
- conformance-s6b-restore.test.mjs rewritten with a configurable fake child and temp-dir fake checkouts (the real checkout is never touched). It now covers: settings.local.json absent beforehand (removed afterwards), a throw mid-probe (hung child, turn times out; file restored, and removed when absent), pre-existing allowed.txt (non-UTF-8 bytes, untracked) and denied.txt (tracked) surviving byte for byte with `git status` unchanged, new probe outputs deleted, and a check that fails if the comparison is skipped (the fake logs each start; the test requires a start in the checkout cwd and comparison 1/2 evidence lines).
- The pre-existing-file test was red before the fix ("allowed.txt was overwritten").

## Numbers
- Conformance files (round4, s6b-restore, conformance.test): 160 pass, 0 fail.
- Full npm test (/tmp/202-tests.txt): 2636 pass, 0 fail, 0 skipped.

## Notes
- Only the two named probe outputs are protected; the probe prompt asks for allowed.txt only, so other filenames are not expected. A probe writing some unrelated file in the checkout would not be cleaned up.
- No /code-review pass this round (narrow bounce).

```json
{
  "ticket": "organism-infra/202-conformance-spikes-round-4-fixes",
  "cell": "developer",
  "current_step": "Both bounce items fixed test-first and committed (d6ea72d); conformance files 160/160, full suite 2636/2636. Ready for qa re-verify.",
  "artifacts": [
    {"path": "apps/bridge/cells/conformance.mjs", "note": "compareS6bAllow backs up and restores allowed.txt and denied.txt in the main checkout"},
    {"path": "apps/bridge/cells/conformance-round4.test.mjs", "note": "new S6b hook_started exclusion test"},
    {"path": "apps/bridge/cells/conformance-s6b-restore.test.mjs", "note": "7 tests with temp-dir fake checkouts"}
  ],
  "decisions": [
    {"decision": "Option for (b): back up and restore pre-existing probe outputs rather than refuse the comparison."}
  ],
  "failures": [],
  "pending": [
    {"item": "qa re-verify (light) of the two bounce items", "owner": "qa"}
  ]
}
```
