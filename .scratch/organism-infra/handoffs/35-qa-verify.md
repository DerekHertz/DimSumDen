```json
{"ticket":"organism-infra/35-release-event-records-force","cell":"qa","mode":"verify","current_step":"light verify complete: QA pass","artifacts":["apps/organism-infra/board-release-gate.test.mjs"],"decisions":["QA pass"],"failures":[],"pending":[{"item":"security review","owner":"security"},{"item":"apply handoff skill text change from 35-developer.md (brain gate)","owner":"orchestrator"}]}
```

## Summary

QA pass (light verify) on feature/organism-infra-35-release-gate at cd4cb91.

- Full npm test: 266 pass, 0 fail, 0 skipped.
- board-release-gate.test.mjs (my 143617b tests): absent from the 143617b..cd4cb91 diff, so unchanged.
- Fixture changes (board-fixture.mjs writeValidHandoff, board-cli-hardening.test.mjs stateBlock/writeHandoff, +60s mtime) only add cell and push mtime past the claim. No assertions changed; overrides can still set cell. They do not hollow out other tests.
- board-service.mjs: gate filters by cell, mode (when claimed with one) and lock mtime; release events carry force: Boolean(force). Matches criteria.
- Live check from the worktree: release before this handoff existed was refused (no handoff with cell qa mode verify, written after the claim).

Limit (developer noted): cell/mode/mtime are self-declared (ADR 0008 decision 11).
