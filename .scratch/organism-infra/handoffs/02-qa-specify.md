# organism-infra/02 — qa specify handoff

**Branch:** `qa/organism-infra-02-board-cli` (off `origin/main`, worktree `agent-a89bf11b2cd557ac2`)
**Commit:** `fdd4d01` — "qa/organism-infra-02: failing acceptance tests for the board CLI"

## What's here

- `apps/organism-infra/board-cli.test.mjs` — 19 `node --test` cases, each spawning the real `board` CLI (`node apps/organism-infra/board.mjs <args>`) as a child process against a disposable git fixture repo + linked worktree. Never touches this repo's own `.scratch/`.
- `apps/organism-infra/board-fixture.mjs` — test-only helper: builds the fixture repo/worktree, spawns `board`, and spawns a short-lived child to get a real dead pid for stale-lock tests.

All 19 tests currently fail on the missing `apps/organism-infra/board.mjs` (ENOENT/exit 1), confirmed by running `node --test apps/organism-infra/board-cli.test.mjs` — no test-setup bugs.

## Criterion → test map

| Ticket criterion | Tests |
|---|---|
| Works from any worktree, writes only the main checkout's board (`$ORGANISM_ROOT` / `git worktree list`) | 1–2 |
| Two concurrent claims, exactly one wins | 3 |
| Locking: live lock never stolen; stale reclaim (dead pid, same host, past age floor, tombstone); fresh/different-host lock not reclaimed; claim lock never auto-expires | 4–8 |
| Atomic writes, `events.jsonl` schema, release as one atomic call, no temp-file leftovers | 9–12 |
| Comments stamped with cell type + date | 13 |
| Validation: path traversal (id/feature), oversized args, symlink escape | 14–17 |
| `status`/`list` output | 18–19 |
| `organism-protocol`/genome wording change | **human-verified** (not test-observable) |
| Runs the full code relay | **human-verified** (process criterion, satisfied by this relay itself) |

## Note for the developer

The ADR fixes the write lock's JSON content (`{pid, host, createdAt}`) but not its file path. I pinned `<ticket>.write-lock.json` next to the existing `.lock` claim file, in the same issues directory, so tests can inject/observe it. If you use a different path, say so in your handoff — I'll re-point the tests at verify time rather than bounce on a naming mismatch.

## Next

Developer picks up ready-for-agent, implements `apps/organism-infra/board.mjs` against these tests. `qa verify` (light — I wrote these tests) reruns the suite and diffs test files against commit `fdd4d01` before security review.
