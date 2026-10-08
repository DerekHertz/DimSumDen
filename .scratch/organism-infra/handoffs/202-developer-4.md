# 202 developer handoff 4 (fix round after bounce 2)

Branch feat/202-conformance-spikes-round-4-fixes. Scope was the two items the user approved, nothing more.

## What changed

1. `apps/bridge/cells/conformance.mjs`, `compareS6bAllow` finally block: each restore (settings.local.json, allowed.txt, the deny target) runs in its own try/catch through one `restore(f, bytes)` helper. A failure is collected, the other restores still run, and after all of them the finally throws `S6b could not restore the main checkout: <file>: <message>`. That error is loud: runControl reports it as `could not run the control: ...`.
2. `apps/bridge/cells/conformance-s6b-restore.test.mjs` (developer-added file, same directory as before):
   - Fake child gets two new options. `throwViaOut` puts a directory where the probe's capture file `S6b-compare-repo.jsonl` goes, so `writeCaptures` throws inside the try right after the comparison child is killed. `breakLocalRestore` clobbers allowed.txt and denied.txt and puts a directory where settings.local.json was, so that restore fails.
   - Two new real-throw tests: pre-existing settings.local.json, allowed.txt (non-UTF-8) and denied.txt (tracked) come back byte for byte with `git status` unchanged; and with nothing pre-existing, the probe's files are removed. Both assert `r.control.evidence` matches `could not run the control`, so the test proves a throw happened.
   - One new test for the per-restore guard: settings.local.json restore fails, allowed.txt and denied.txt are still restored, and the failure is reported.
   - The two old "throw" tests did not throw (waitFor resolves null on timeout). Renamed to "a probe that never answers ..." and the comment fixed. Their assertions are unchanged.
3. conformance-round4.test.mjs and the qa specify tests are untouched.

## Verification

- Restore test file: 10 of 10 pass.
- Mutation check (temporary, file restored after): with the old unguarded restore sequence, only the new guard test fails; with no restore at all, tests 1-9 fail, including both real-throw tests (5, 6).
- Full `npm test` (run by scout): 2639 pass, 0 fail, 0 skipped. `node --check` on conformance.mjs clean.
- Commit c60e449.

```json
{
  "ticket": "organism-infra/202-conformance-spikes-round-4-fixes",
  "cell": "developer",
  "current_step": "Bounce 2 fixed: real mid-probe throw tests added for the S6b restore, and each finally restore guarded individually. Committed on the branch, released at in-review.",
  "artifacts": [
    {"path": "apps/bridge/cells/conformance.mjs", "note": "compareS6bAllow finally: per-restore try/catch, aggregated error after all restores ran"},
    {"path": "apps/bridge/cells/conformance-s6b-restore.test.mjs", "note": "fake gains throwViaOut and breakLocalRestore; 3 new tests; 2 hang tests renamed"}
  ],
  "decisions": [
    {"decision": "Throw is produced by a directory at the probe's capture path, so writeCaptures fails inside the try; no test seam added to production code."},
    {"decision": "Failed restores are reported by throwing after all restores ran, not swallowed; the control surfaces it as 'could not run the control'."}
  ],
  "failures": [],
  "pending": [
    {"item": "Light re-verify of check 3 (throw coverage) and the per-restore guard.", "owner": "qa"}
  ]
}
```
