```json
{"ticket": "organism-infra/50", "cell": "developer", "mode": null, "current_step": "Implemented; full suite 382/382 pass; committed on feature/organism-infra-50-verdict-lock.",
 "artifacts": ["apps/organism-infra/board-service.mjs", "scripts/log-cell.mjs", "docs/adr/0008-board-service.md"],
 "decisions": ["verdict lock check lives in comment() under the write lock; qa needs lock mode verify", "log-resolved dup check + append wrapped in withWriteLock", "ADR 0008 decision 14 added"],
 "failures": ["cell-start refused: branch feature/organism-infra-50-verdict-lock already existed (qa created it); ff-merged 5e46213 into the worktree branch instead", "Bash guard refused a heredoc/chained edit; used Write plus node"],
 "pending": [{"item": "qa verify, security review", "owner": "qa"}]}
```

## State
Done. All 9 red tests green, no qa test edited. Full suite: 382 pass, 0 fail.

## What changed
- board-service.mjs comment(): --verdict refused without a claim lock; a qa lock must be mode verify.
- board-service.mjs logResolved(): duplicate check and append under the write lock.
- log-cell.mjs: --failures parsing/validation (before any write), incident rows appended in one write after the cell row, symlinked .scratch refused.
- ADR 0008 decision 14.

## Next step
qa verify, then security.
