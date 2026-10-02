```json
{
  "ticket": "organism-infra/114-resolve-undo-foreign-lock",
  "cell": "qa",
  "mode": "verify",
  "current_step": "light verify done: test file unchanged since specify (2d6004a), npm test 1814 pass, no skips, board-resolve tests 18/18 green including all 4 new tests",
  "artifacts": [
    "branch fix/114-resolve-undo-foreign-lock, commit 9db4ab5 (developer, on qa's 2d6004a)",
    "apps/organism-infra/board-service.mjs catch block verified"
  ],
  "decisions": [],
  "failures": [],
  "pending": []
}
```

## Summary

**QA pass:** Light verify completed. Test file `apps/organism-infra/board-resolve.test.mjs` unchanged since qa-specify (2d6004a); all tests pass (1814 total, 0 skipped). All four acceptance criteria covered and passing.

## Test results

- Full `npm test`: 1814 tests, 1814 pass, 0 failed, 0 skipped
- `apps/organism-infra/board-resolve.test.mjs`: 18 tests, 18 pass
  - All 4 new tests pass:
    - ok 15: 114 AC2: mid-batch failure, failing ref
    - ok 16: 114 AC2: first-ref failure
    - ok 17: 114 AC1: foreign lock survives
    - ok 18: 114 AC3: resolved ref listed despite usage append failure

## Acceptance criteria

| AC | Test | Status |
|---|---|---|
| 1. A foreign lock claimed mid-batch survives a failed resolve, untouched | `114 AC1: a foreign lock claimed mid-batch survives a failed resolve, untouched` | PASS (ok 17) |
| 2. A mid-batch failure undoes only the orchestrator's own claim and reports resolved / not attempted refs | `114 AC2: a mid-batch failure undoes only the failing ref's own orchestrator claim ...` (ok 15) and `114 AC2: a failure on the first ref undoes its claim and reports nothing resolved` (ok 16) | PASS (ok 15–16) |
| 3. A ref whose release wrote resolved appears in resolved: even if the usage append failed | `114 AC3: a ref whose release wrote resolved is listed under resolved: even when the usage append failed` | PASS (ok 18) |
| 4. `npm test` green | Full test suite | PASS (1814 green) |

## Files touched

- `apps/organism-infra/board-service.mjs` (in scope): catch block only, 19 insertions, 7 deletions

No out-of-scope changes.

## Notes

Developer reported `apps/ui/src/overlay/floating-cards.test.mjs` 'Ctrl+Enter in the Note sends Deny' as flaky (fails in full suite, passes alone, 1 fail in developer's run). Did not reproduce this run (all 1814 pass). Monitoring as pre-existing flake unrelated to 114.
