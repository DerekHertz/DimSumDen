# organism-infra/02 — developer handoff

**Branch:** `claude/organism-infra-02-board-cli` (off qa's `fdd4d01`)
**Commit:** `2850cdd` — "organism-infra/02: implement board CLI over a board-service module"
**Status left:** `in-review` (orchestrator holds the claim lock; not released here)

## What's here

- `apps/organism-infra/board-service.mjs` — the board service module (ADR 0008 decision 1's seam): `resolveRoot`, `parseTicketRef`/`boardPaths` (validation + path layout), `claim`, `release`, `getStatus`, `comment`, `list`. All mutations run inside `withWriteLock`.
- `apps/organism-infra/board.mjs` — thin CLI: parses argv, calls the service, prints, sets `process.exitCode`. `#!/usr/bin/env node` shebang; wired as npm `bin.board` and `scripts.board`.

## Design notes

- **Root resolution:** `$ORGANISM_ROOT` env wins if set; otherwise `git worktree list --porcelain` from `cwd`, first `worktree ` line.
- **Write lock:** `<ticket>.write-lock.json` (qa's pinned path, used as-is), `{pid, host, createdAt}`. Reclaim requires same host + dead pid (`process.kill(pid, 0)`) + age > 5s; race-free via tombstone rename before re-create, per ADR decision 2.
- **Claim lock:** `<ticket>.lock`, `"<cell-type> <ISO date>\n"`, never auto-expires; only `release` deletes it.
- **Atomic writes:** temp-file + rename for ticket markdown and `events.jsonl`.
- **Validation order (before any fs access):** ticket ref splits into exactly 2 segments, feature `^[a-z0-9-]+$`, ticket `^\d{2}-[a-z0-9-]+$`, arg length capped at 4000 chars. After that, `assertWithinRoot` walks up to the nearest existing ancestor and checks its `realpath` stays under the board root — catches symlink escapes the regex can't.
- **`comment`** has no cell-type CLI argument (matches the ADR's command set); it reads the current claim-lock's cell type to stamp the comment and event.

## Tests

- `node --test apps/organism-infra/board-cli.test.mjs`: 19/19 pass, unmodified.
- `npm test` (full suite): 81/81 pass, exit 0.
- No new dependencies. `npm install` was needed (`node_modules` was absent); nothing added beyond the existing `playwright` devDependency.

## Proposed wording for the brain gate (not applied — genome/skill change)

For `organism-protocol`, under "Claiming a ticket" and "Apoptosis": replace direct file edits to `.lock`/ticket markdown with `board claim <feature>/<NN-slug> <cell-type>` and `board release <feature>/<NN-slug> --status <status> [--reason "..."]`; replace ad hoc `## Comments` edits with `board comment <feature>/<NN-slug> "<text>"`. Drop the "sanctioned exception" paragraph about worktree cells shelling out to write the main checkout's board directly — `board` now resolves `$ORGANISM_ROOT`/`git worktree list` itself, so that workaround is obsolete. Cell genomes that reference editing board files directly (developer, qa, security, orchestrator) should point at `board` the same way.

## Next

qa verify: rerun the 19 tests, diff `board-cli.test.mjs`/`board-fixture.mjs` against `fdd4d01` (unchanged), then security review.
