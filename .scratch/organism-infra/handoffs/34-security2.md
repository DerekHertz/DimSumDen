# 34 security re-check (fix diff 3955bac..e044bb7)

Verdict: Security pass.

## State
- Ticket: organism-infra/34-worktrees-base-on-prior-hop
- Commit reviewed: e044bb7 (detached); scope only the diff 3955bac..e044bb7
- Cell: security (re-check)
- Result: pass; no findings at medium or above

## Findings
- MEDIUM (npm ci cwd / no package.json): FIXED. `spawnSync("npm", ["ci"], { cwd: toplevel })` at scripts/cell-start.mjs:74; a `cat-file -e <base>:package.json` check refuses before switching (:65-67).
- LOW (fail-open on worktree list): FIXED. Non-zero status and no `worktree ` record both fail (:44-47).

## New-code check
- `cat-file -e` argument: `base` is the full SHA from `rev-parse --verify <x>^{commit}`, not raw user input, so it cannot begin with `-` or inject a pathspec. spawnSync uses an argv array, no shell.
- `-z` parsing: records are NUL-separated; `split("\0")` + `startsWith("worktree ")` is correct. A path with a newline no longer breaks it (an improvement).
- 15/15 tests in scripts/cell-start.test.mjs pass at e044bb7.

## Comments (non-blocking)
- LOW, scripts/cell-start.mjs:26 (unchanged): `startsWith("--")` accepts `-x` values; harmless because the base is re-resolved by rev-parse and git rejects them. The developer noted this in docs/agents/cell-start.md.
- LOW, docs note: `npm ci` runs lifecycle scripts and `.npmrc` from the commit under review. No install scripts in the lockfile today. Consider `--ignore-scripts` for security/qa-verify hops; the orchestrator's call.
