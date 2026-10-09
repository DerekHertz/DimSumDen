# 217 qa verify (light)

Verdict: QA pass. Branch fix/217-board-claim-cell-flag, developer commit 69bd605, specify commit 8fb6f76.

```json
{
  "ticket": "organism-infra/217-board-claim-cell-flag",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify done. QA pass. Test file unchanged since specify (8fb6f76). All 7 claim-cell-flag tests pass in the saved suite output. Only apps/organism-infra/board.mjs changed outside the tests, inside ticket scope.",
  "artifacts": [
    {"path": "apps/organism-infra/board.mjs", "note": "developer change (+18/-2), claim case: --cell allowed, conflict check vs positional, usage line on claim parse errors"},
    {"path": "apps/organism-infra/board-claim-cell-flag.test.mjs", "note": "specify tests, unchanged: git diff 8fb6f76 HEAD is empty"},
    {"path": "/tmp/217-tests.txt", "note": "developer's full npm test output, used as the suite result per dispatch; qa did not re-run the suite"}
  ],
  "decisions": [
    "Light verify, following the dispatch: suite result taken from /tmp/217-tests.txt, not re-run by qa. Summary lines in that file: tests 3177, pass 3177, fail 0, cancelled 0, skipped 0, todo 0.",
    "Criterion map: AC1 (--cell claims like positional) -> tests ok 276 and ok 277. AC2 (--as qa exits non-zero, usage line, no lock) -> ok 278, plus ok 279 (positional plus --as). AC3 (different positional and --cell refused, no lock, names both values) -> ok 280; same value allowed -> ok 281; --cell with no value refused -> ok 282. AC4 (npm test green) -> saved output above, no new test.",
    "No criterion is human-verified. All are automated.",
    "Scope check: git diff --stat 8fb6f76 HEAD lists only apps/organism-infra/board.mjs. Nothing outside the ticket's scope."
  ],
  "failures": [
    {"what": "Grep tool call failed: 'No such tool available: Grep'.", "cause": "Grep is not in this session's tool set.", "fix": "Used grep through Bash instead. Guardrail-free friction, not a real block."}
  ],
  "pending": []
}
```

## Light verify steps

1. Suite: taken from /tmp/217-tests.txt per the dispatch line ("do not re-run the suite"). Summary: 3177 tests, 0 fail, 0 skipped. The Low-80 jev-hardening test passes in that run, so the /tmp/.git environment issue from the developer handoff did not affect this output.
2. Test diff: `git diff 8fb6f76 HEAD -- apps/organism-infra/board-claim-cell-flag.test.mjs` is empty. No assertion removed or loosened.
3. Criterion to test map: see the State block decisions above.
4. Files touched outside the ticket's scope: none. Listed for the record only: apps/organism-infra/board.mjs (in scope).

Judgment calls: none needed. The rules applied as written.
