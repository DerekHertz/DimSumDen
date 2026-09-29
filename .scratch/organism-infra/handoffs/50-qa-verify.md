```json
{"ticket": "organism-infra/50", "cell": "qa", "mode": "verify", "current_step": "QA pass on c031b54.",
 "artifacts": [], "decisions": ["QA pass"], "failures": [], "pending": [{"item": "security review", "owner": "security"}]}
```

## State
QA pass. Branch feature/organism-infra-50-verdict-lock at c031b54 (developer commit on top of qa 5e46213).

## Checks
- Full suite: 382 pass, 0 fail, 0 skipped.
- `git diff 5e46213 HEAD` on the three qa test files: empty. No test touched.
- Criteria: verdict lock incl. orchestrator (verdict-lock-failures.test.mjs, verdict-roles.test.mjs); --failures rows and bad input writes nothing (verdict-lock-failures.test.mjs); symlinked .scratch refused (same file); concurrent log-resolved one row (same file, regression guard); ADR 0008 decision 14 matches the pinned regex and mentions --failures.
- --failures validation: scripts/log-cell.mjs:39-52 parses and fails on every bad item before the ticket-exists check, the symlink check, mkdir and open (lines 54-81). Cell row and incident rows go out in one writeSync, so nothing is written on refusal, the cell row included.
- board-service.mjs comment(): verdict refused with no lock, and qa lock must be verify; logResolved dup check and append are under withWriteLock.

## Scope
Diff touches only apps/organism-infra/board-service.mjs, scripts/log-cell.mjs, docs/adr/0008-board-service.md. All in scope.

## Notes
- The concurrent log-resolved test and six --failures refusal tests were vacuous-green before implementation (per specify). The refusal tests now have meaning since accept tests pass.
- Tool list is not exported from log-cell.mjs (ticket said "exported"; importing runs the script). Untested and pre-noted in specify; security/orchestrator may judge.

## Next step
security review.
