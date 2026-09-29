```json
{"ticket":"organism-infra/35-release-event-records-force","cell":"security","current_step":"full security review complete: Security pass","artifacts":["apps/organism-infra/board-service.mjs","apps/organism-infra/board-fixture.mjs","apps/organism-infra/board-release-gate.test.mjs"],"decisions":["Security pass at cd4cb91; no findings at medium or above"],"failures":[],"pending":[{"item":"merge proposal and handoff skill text change from 35-developer.md (brain gate)","owner":"orchestrator"}]}
```

## Summary

Security pass on feature/organism-infra-35-release-gate at cd4cb91 (diff vs origin/main: 6 files; no package.json, lockfile or workflow changes).

- Secrets: pattern grep of the diff found nothing (gitleaks not installed). No dependencies added.
- Tests: full npm test in a detached worktree at cd4cb91, 266 pass, 0 fail.
- Gate (board-service.mjs validateHandoffState and release): the added filters only narrow the candidate set (cell, mode, mtime >= claim lock mtime), so the change fails closed. Cell and mode are compared by strict equality against parsed JSON; nothing new reaches a shell, a path, or the UI. File selection is unchanged (NN- prefix, isFile, inside the feature handoffs dir). The claim lock is read and stat-ed inside withWriteLock, so no new race.
- force: Boolean(force) on every release event is a boolean, so the audit trail cannot take free text. The separate override event is unchanged.
- ADR 0008 decision 11 states the limits honestly.

## Comments (non-blocking)

- LOW, apps/organism-infra/board-service.mjs release() (~line 845, ~870): a release with no lock file gives cell unknown and no claim binding, so the cell/mode/age checks are skipped (the older any-matching-handoff check still applies). Documented in ADR 0008 decision 11. Consider refusing gated releases with no lock, or requiring --force.
- LOW, apps/organism-infra/board-service.mjs validateHandoffState (~line 636): cell, mode and file mtime are self-declared and forgeable (write a handoff naming any cell, or utimes it). Catches stale or wrong-hop handoffs only, as ADR 0008 decision 11 says. No fix needed.
- LOW, apps/organism-infra/board-fixture.mjs writeValidHandoff: pushes handoff mtime 60s into the future and parses the lock as cell _ mode by token position. Test-only; would fall back to developer if the lock format changed.
