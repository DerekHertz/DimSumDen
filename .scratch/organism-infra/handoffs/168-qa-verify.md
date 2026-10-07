# 168 qa verify handoff

## Summary

**QA pass.** All 11 specify tests pass (4.5s run); full suite passes (2245 tests, no regressions). No test assertions were weakened. Package.json and scripts/test-lock.mjs are the only files modified—both in scope.

## Acceptance criteria to tests

1. Two full runs run one after the other; waiter names the holder
   - "two runs started together never overlap" ✓
   - "a waiting run prints one line naming the holder's pid and worktree" ✓

2. Lock released on normal exit, failure, SIGTERM, SIGINT
   - "lock is released after a normal exit" ✓
   - "lock is released after a failing command (exit code passes through)" ✓
   - "lock is released on SIGTERM" ✓
   - "lock is released on SIGINT" ✓

3. Stale lock with dead pid taken over
   - "a stale lock left by a SIGKILLed holder is taken over" ✓

4. Bounded wait exits nonzero with message
   - "wait is bounded: exits non-zero with a timeout message and does not run the command" ✓

5. `node --test <file>` unaffected
   - "targeted runs take no lock (test:path and node --test run while the lock is held)" ✓
   - "package.json test script goes through the lock wrapper; test:path does not" ✓

6. Existing tests still pass
   - Full `npm test`: 2245 tests pass, all green ✓

7. Default lock location outside repo
   - human-verified (TEST_LOCK_PATH env knob; default falls through to os.tmpdir()) ✓

## Test results

- `node --test scripts/test-lock.test.mjs`: 11/11 pass
- `npm test`: 2245/2245 pass, 0 failures, 0 skipped
- git diff (99471e8..HEAD): test file unchanged; only package.json and scripts/test-lock.mjs modified (in scope)

## Files touched outside scope

None.

```json
{
  "ticket": "organism-infra/168-serialize-full-test-runs",
  "cell": "qa",
  "mode": "verify",
  "current_step": "All acceptance criteria mapped to passing tests. Full test suite passes with no regressions. Handoff ready.",
  "artifacts": [],
  "decisions": [
    "Test file scripts/test-lock.test.mjs is unchanged (no assertions weakened)",
    "All 11 specify tests pass without modification",
    "Full suite 2245/2245 tests pass (verified criterion 6)",
    "Only package.json and scripts/test-lock.mjs were modified by developer (in scope)"
  ],
  "failures": [],
  "pending": []
}
```
