```json
{"ticket": "organism-infra/60-cell-start-claims-ticket", "cell": "developer",
 "current_step": "batch A implemented on feat/batchA-board-friction at f39c18c; npm test 1208/1208; .claude edits scripted, not applied",
 "artifacts": ["apps/organism-infra/board-service.mjs", "apps/organism-infra/board.mjs", "apps/organism-infra/board-audit.mjs",
   "scripts/cell-start.mjs", "scripts/board.mjs", "scripts/test-path.mjs", "package.json",
   "docs/agents/cell-start.md", "docs/agents/issue-tracker.md",
   "apps/organism-infra/board-handoff-template-errors.test.mjs", "apps/organism-infra/board-release-verdict.test.mjs",
   "apps/organism-infra/board-audit-refs.test.mjs", "/tmp/batchA-claude-edits.mjs"],
 "decisions": ["78: any git working tree is refused except the main checkout's .scratch/; five older handoff test helpers now draft beside the fixture worktree",
   "54: board release --verdict is redirected to board comment --verdict, not accepted",
   "81: in-review with no lock is flagged as the ticket asks, though it is the normal wait for qa verify"],
 "failures": ["nested node --test exited 0 on failure until test-path.mjs dropped NODE_TEST_CONTEXT (fixed)"],
 "pending": [{"item": "user applies and commits the .claude edits: node /tmp/batchA-claude-edits.mjs /home/dhertzell/dsd-batchA-dev", "owner": "orchestrator"},
   {"item": "qa verify batch A on feat/batchA-board-friction (tests f7be419)", "owner": "qa"}]}
```

## State

Done for batch A code: 78, 66, 60, 54, 81 (and 32's `docs/agents/` part). The `.claude/` parts of 32, 60, 66, 78 and 81, and all of 82, are scripted but not applied.

## What changed

Branch `feat/batchA-board-friction`: qa tests f7be419, then origin/main (4a012b7, ticket 72) merged at 6da6215.
- f9a6989 78: `board handoff --from` refuses a draft inside any git working tree except the main checkout's `.scratch/`. The message names `/tmp`.
- 862bd00 66: `board handoff <ref> --template [--cell c] [--mode m]` prints a State block that passes validateState, with one example `pending` entry.
- 3ac7982 60: `cell-start --ticket <ref> --cell <type> [--mode m]` runs `board claim` after `npm ci`. A refused claim exits 1 with the board's message.
- 3fa335c 32: `docs/agents/issue-tracker.md` lists the claim modes per cell and points at `--template`.
- dfa2ecf 54: `scripts/board.mjs` shim; `npm run test:path -- <file|dir>...`; `board release --verdict` now names `board comment --verdict` (was "unrecognized flag").
- c9f8ab0 81: `board audit [--stale-days N] [--feature F] [--json]`. Kinds: `no-lock`, `no-branch`, `unblocked`, `blocked-by-missing`, `orphan-pending`, `stale`. Exit 0/1/2; read-only.
- f39c18c 81: documents `board audit` in `issue-tracker.md` and splits two bullets that 3fa335c joined (docs only; the suite ran at c9f8ab0).

## Decisions made

- 66: with no lock and no `--cell`, `--template` errors rather than print a placeholder cell. `--template` refuses `--from`/`--name`, and `--cell`/`--mode` without `--template` are refused.
- 54: `test:path` resolves relative paths from `INIT_CWD`, recurses (skipping `node_modules` and dot-dirs) and runs as a top-level runner.
- 81: a lock counts as backed when a branch or worktree path contains the slug, `<feature>-<NN>`, or a `/<NN>-` segment, or a branch is named in the ticket or its handoffs. `unblocked` fires only at status `blocked`. A missing blocker annotated `(resolved)` counts as resolved. Pending items that name their own ticket are skipped. On the real board today it reports 2 findings: 03 `unblocked`, 57 `no-lock` (in-review).
- `readStatus` is now exported from `board-service.mjs`.

## .claude edits (not applied)

Apply and commit in the worktree with one command: `node /tmp/batchA-claude-edits.mjs /home/dhertzell/dsd-batchA-dev`. It replaces 8 exact strings in 4 files, aborts before writing if any anchor is missing, then commits. A dry run on a copy applied cleanly.
- organism-protocol: claim modes per cell and `cell-start --ticket` (32, 60); `--template` and drafting under `/tmp` (32, 66, 78); a Batches paragraph (82).
- handoff skill: drafts under `/tmp` (78); names `board handoff --template` (66).
- orchestrator genome: dispatch lines pass `--ticket/--cell/--mode` (60); a new "Batches" section (82).
- pipeline-retro: Gather runs `npm run -s board -- audit` (81).

## Next step

The user applies the `.claude` script, then qa runs a light verify of the batch at the resulting head.

## Suggested skills

`organism-protocol`, `code-review`.

## Gotchas

- Under a parent `node --test`, a child `node --test` inherits `NODE_TEST_CONTEXT` and exits 0 on failures.
- Every new handoff test must draft outside the fixture worktree (see `board-status-friction.test.mjs`).
