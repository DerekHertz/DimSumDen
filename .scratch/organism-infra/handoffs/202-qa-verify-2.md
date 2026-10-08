# 202 qa verify handoff 2 (light re-verify after bounce 1)

Branch feat/202-conformance-spikes-round-4-fixes, head d6ea72d (delta 5fbe6cf..d6ea72d). Verdict: QA bounce, on check 3 only. Posted with `--verdict bounce`. Ticket status stays `in-review`.

Suite: `/tmp/202-tests.txt` used, not re-run (per orchestrator). 2636 pass, 0 fail, 0 skipped, 0 todo, 0 cancelled. The S6b tests in that file (restore suite, hook_started guard) are listed as ok.

## Checks

1. Specify tests unchanged. `git diff 3c3c1fc..d6ea72d -- apps/bridge/cells/conformance-round4.test.mjs` adds 7 lines and removes none. The only addition is the new test at l.479-484. PASS.

2. Finding (a), S6b hook_started exclusion. New test `setup guard, S6b: a hook_started event is not a setup failure` (conformance-round4.test.mjs:479-484) runs `runSetup("S6b", { hook: true })` and asserts the evidence does not match /hook_started/. Trace: the fake emits hook_started in its init run (round4 test l.436). runS6b returns `captures: { main: capture }` (conformance.mjs:1189), and runSpikes calls `setupProblems(captures, { spike: "S6b" })` (l.1334). Without the `spike !== "S6b"` guard at conformance.mjs:485, the setup problem "hook_started event..." reaches the evidence and the test fails. With it, the test passes. Basis is code trace, not a mutation run by qa this round. PASS.

3. Finding (b), S6b restore. Code: PASS. Backups of allowed.txt and the deny target are taken at conformance.mjs:1123-1124, before the `try`. The `finally` at l.1137-1143 writes the bytes back, or removes the file when absent. A zero-length Buffer is still truthy, so it is restored. Temp dirs only: makeRepo and runS6bWith use mkdtempSync(tmpdir()) (restore test l.40-62). PASS.

   Test coverage (conformance-s6b-restore.test.mjs), one case per requested item:
   - settings.local.json absent beforehand, removed after: l.84-93. PASS.
   - pre-existing settings.local.json byte for byte: l.70-82. PASS.
   - pre-existing allowed.txt (non-UTF-8, untracked) and denied.txt (tracked) byte for byte, `git status` unchanged: l.117-137. PASS.
   - skipped comparison: l.148-155 asserts a checkout start and the "comparison 2 (main checkout" evidence line. PASS.
   - throw mid-probe: NOT COVERED. l.95-107 and l.109-115 are named "throw" tests, but they do not throw. `runTurn` calls `waitFor` (conformance.mjs:656), which on timeout resolves `null` (l.558). It never rejects. `finish()` (l.659-664) then closes stdin, the fake exits on readline `close` (restore test l.35), and `compareS6bAllow` returns normally. The restore those tests assert happens on the normal path. The `finally` on a real throw is untested.

   Non-blocking notes:
   - finally restores are not individually guarded (conformance.mjs:1138-1143). If the restore of settings.local.json throws, allowed.txt and denied.txt are not restored. Not tested.
   - Restore test l.136 accepts "skipped / refus / not run" as an alternative to running. No code path emits those words, so in practice it requires the comparison to run. Not a bounce.

## Light-verify steps
1. Suite: taken from /tmp/202-tests.txt. Nothing skipped.
2. Test-file diff vs 3c3c1fc: additions only in round4. Restore test file is new (developer-added in the same directory, as in verify 1).
3. Criterion map: AC1-AC9 unchanged from verify 1. Scope items: S6b hook_started exclusion now has a test. S6b restore: all items covered except the throw path (check 3 above).
4. Files touched outside the ticket's named file: apps/bridge/cells/conformance-s6b-restore.test.mjs (new, same directory, as before). Listed, not judged.

## To the developer (bounce 2)
- Add a test that makes a probe throw inside compareS6bAllow's try block, then assert the restore. The current hang test does not exercise it. Options: a fault that makes a write inside the try fail, or a test seam. Or drop the "throw" name if the path is not worth covering.
- Optional: guard each finally restore so one failure does not skip the others.

## Judgment calls for the orchestrator
- Check 3's throw coverage is a bounce under the orchestrator's stated checks. The code path itself looks correct; the gap is the test. If you want a ruling on whether it blocks, escalate to full verify.

```json
{
  "ticket": "organism-infra/202-conformance-spikes-round-4-fixes",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light re-verify done. Check 1 PASS, check 2 PASS (finding a), check 3 BOUNCE: restore code correct, but the 'throw mid-probe' tests never throw. Verdict bounce posted with --verdict bounce.",
  "artifacts": [
    {"path": "apps/bridge/cells/conformance-round4.test.mjs", "note": "l.479-484 new S6b hook_started test; additions only vs 3c3c1fc"},
    {"path": "apps/bridge/cells/conformance.mjs", "note": "l.485 S6b guard; l.1121-1143 backup/restore in finally; l.558 waitFor resolves null on timeout"},
    {"path": "apps/bridge/cells/conformance-s6b-restore.test.mjs", "note": "l.95-115 throw tests do not throw; l.84-93, 117-137, 148-155 cover absent file, byte-for-byte restore and skip"}
  ],
  "decisions": [
    {"decision": "Suite result taken from /tmp/202-tests.txt; npm test not re-run, per orchestrator instruction."},
    {"decision": "Finding (a) judged by code trace, not a mutation run this round."},
    {"decision": "Verdict bounce on check 3 (throw path untested). Posted with --verdict bounce."}
  ],
  "failures": [],
  "pending": [
    {"item": "Developer adds a test that makes a probe throw inside compareS6bAllow's try and asserts the restore, or renames the tests if no throw is intended. Optionally guard each finally restore.", "owner": "developer"}
  ]
}
```
