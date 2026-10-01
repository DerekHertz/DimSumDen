```json
{"ticket":"organism-infra/78-handoff-refuses-worktree-draft","cell":"security","current_step":"Security pass — batch A (78,66,60,32,54,81,82) all clear on feat/batchA-board-friction @ 1191686","artifacts":["apps/organism-infra/board-service.mjs"],"decisions":["refuseWorktreeDraft uses realpath + isWithin(path.sep-safe); symlink escapes not possible","execFileSync(\"git\",[\"rev-parse\",\"--show-toplevel\"],{cwd:dir}) uses no user-controlled args — low risk","No critical or high findings across full 1509-line diff; no new dependencies; gitleaks found 0 leaks in 9 commits"],"failures":[],"pending":[]}
```

## State
Done. Security pass.

## What changed
Branch `feat/batchA-board-friction`, HEAD `1191686`. 27 files, 1509 insertions, 19 deletions.

## Decisions made
- All shell-outs use `spawnSync`/`execFileSync` without `shell:true`; no untrusted data reaches command args.
- `isWithin()` in board-service.mjs correctly handles `..`, `../`, and absolute-path edge cases on Linux (`path.sep='/'`).
- `refuseWorktreeDraft` resolves both paths via `realpath` before comparison, preventing symlink escapes.
- `board audit --feature` validated with `/^[a-z0-9-]+$/`; `--stale-days` validated with `/^\d+$/`.
- `escapeRe()` in board-audit.mjs properly escapes branch names before RegExp construction.
- No new npm dependencies (package.json adds only a `test:path` script entry).
- `npm audit`: 0 vulnerabilities; gitleaks: 0 leaks.

## Next step
Orchestrator: open PR for `feat/batchA-board-friction` and merge on green CI.

## Suggested skills
organism-protocol

## Gotchas
None.
