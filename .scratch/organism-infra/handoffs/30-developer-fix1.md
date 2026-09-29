```json
{"ticket":"organism-infra/30-isolation-guard-handoff-writes","cell":"developer","mode":"fix1","current_step":"security bounce fixed on feature/organism-infra-30-board-handoff at d8124fd; 289/289 tests pass","artifacts":["apps/organism-infra/board-service.mjs","apps/organism-infra/board-handoff.fix1.test.mjs"],"decisions":["publishHandoff asserts handoffs dir within root, rejects symlinked dir and symlinked dest","overwrite allowed only when existing State block has same cell and mode","--from must be a regular non-symlink file, max 256 KB"],"failures":[],"pending":[]}
```

## Summary

Fix round 1: MEDIUM containment, LOW overwrite guard, LOW --from cap and symlink rejection. Six new tests in board-handoff.fix1.test.mjs, written red first. Full suite 289 pass.
