```json
{
  "ticket": "organism-infra/80-jg-guard-and-scout-opt-in",
  "cell": "qa",
  "mode": "specify",
  "current_step": "specify complete — 21 failing tests committed on tests/80-jg-guard-and-scout-opt-in (sha cacf054)",
  "artifacts": [
    "scripts/jg.test.mjs (14 tests: AC1 exclude/refuse, AC3 secret, AC4 row+fallback)",
    "scripts/hooks/bash-guard.jg.test.mjs (7 tests: AC2 block/allow)"
  ],
  "decisions": [
    "Test seam: runJg({ query, root, run, now }) where run(argv) -> { stdout, exitCode } — matches ADR 0014 decision 7 pattern",
    "AC5 (scout genome line) marked human-verified: it is a .claude/ edit applied by the user",
    "bash-guard contract: exit 2 = block, exit 0 = allow, reads JSON from stdin"
  ],
  "failures": [],
  "pending": [
    {"item": "Implement scripts/jg.mjs exporting runJg with the seam contract", "owner": "developer"},
    {"item": "Implement or extend scripts/hooks/bash-guard.mjs with jg rule", "owner": "developer"},
    {"item": "Write scout genome line into their handoff for the user to apply", "owner": "developer"}
  ]
}
```

## Summary

Specify complete. 21 failing tests across 2 files; all fail because the feature modules don't exist yet.

## Branch and commit

- Branch: `tests/80-jg-guard-and-scout-opt-in`
- Commit: `cacf054`
- Base: `05c1240`

## Test files

| File | Tests |
|---|---|
| `scripts/jg.test.mjs` | 14 tests (AC1, AC3, AC4) |
| `scripts/hooks/bash-guard.jg.test.mjs` | 7 tests (AC2) |

## Criterion-to-test map

| Criterion | Test(s) | File |
|---|---|---|
| AC1 — wrapper always passes `--exclude '.scratch/'` | `runJg always passes --exclude '.scratch/' to run` | `scripts/jg.test.mjs` |
| AC1 — wrapper always passes `--exclude '.claude/'` | `runJg always passes --exclude '.claude/' to run` | `scripts/jg.test.mjs` |
| AC1 — refuses `--hidden` | `runJg refuses the forbidden flag --hidden` | `scripts/jg.test.mjs` |
| AC1 — refuses `--no-ignore` | `runJg refuses the forbidden flag --no-ignore` | `scripts/jg.test.mjs` |
| AC1 — refuses `--include-sensitive` | `runJg refuses the forbidden flag --include-sensitive` | `scripts/jg.test.mjs` |
| AC1 — refuses `--include-dependencies` | `runJg refuses the forbidden flag --include-dependencies` | `scripts/jg.test.mjs` |
| AC1 — refuses root inside `.scratch/` | `runJg refuses a root inside .scratch/` | `scripts/jg.test.mjs` |
| AC1 — refuses root inside `.claude/` | `runJg refuses a root inside .claude/` | `scripts/jg.test.mjs` |
| AC2 — bash-guard blocks raw `jg` call | `bash-guard blocks a direct 'jg' call (raw binary)` | `scripts/hooks/bash-guard.jg.test.mjs` |
| AC2 — bash-guard blocks `jg` with subpath root | `bash-guard blocks 'jg' with a subpath root` | `scripts/hooks/bash-guard.jg.test.mjs` |
| AC2 — bash-guard blocks `jg --hidden` (doubly forbidden) | `bash-guard blocks 'jg' with --hidden flag` | `scripts/hooks/bash-guard.jg.test.mjs` |
| AC2 — bash-guard blocks `npx jg` | `bash-guard blocks 'jg' run through npx` | `scripts/hooks/bash-guard.jg.test.mjs` |
| AC2 — bash-guard allows `node scripts/jg.mjs` | `bash-guard allows 'node scripts/jg.mjs' (the approved wrapper)` | `scripts/hooks/bash-guard.jg.test.mjs` |
| AC2 — bash-guard allows wrapper with subdir root | `bash-guard allows 'node scripts/jg.mjs' with a subdirectory root` | `scripts/hooks/bash-guard.jg.test.mjs` |
| AC2 — unrelated commands pass through | `bash-guard exits 0 (allow) for an unrelated single command (rg search)` | `scripts/hooks/bash-guard.jg.test.mjs` |
| AC3 — secret in query refused before run() | `runJg refuses a query containing a secret (sk-style key) without calling run` | `scripts/jg.test.mjs` |
| AC3 — AWS key in query refused before run() | `runJg refuses a query containing an AWS access key without calling run` | `scripts/jg.test.mjs` |
| AC3 — clean query passes through | `runJg does not refuse a plain query with no secret` | `scripts/jg.test.mjs` |
| AC4 — successful call logs a row | `runJg returns a row with kind:'jg', queryLen, filesReturned, fallback:false, ms` | `scripts/jg.test.mjs` |
| AC4 — run() non-zero exit → fallback:true, no throw | `runJg exits cleanly when run() returns non-zero exit (scout fallback)` | `scripts/jg.test.mjs` |
| AC4 — run() throws → fallback:true, no throw | `runJg exits cleanly when run() throws (scout fallback)` | `scripts/jg.test.mjs` |
| AC5 — scout genome line | **human-verified** — `.claude/` edit; developer writes it into their handoff for the user to apply |

## Seam contract (for the developer)

`scripts/jg.mjs` must export:

```js
export async function runJg({ query, root, run, now, usageRoot })
  -> Promise<{ stdout?: string, row: JgRow }>
```

Where:
- `run(argv: string[]) -> Promise<{ stdout: string, exitCode: number }>` — the jg binary runner; injected in tests, real `spawn` in production
- `row: { kind: "jg", ts: string, queryLen: number, filesReturned: number, fallback: boolean, ms: number }`
- Throws (or rejects) with an error matching `/forbidden|refused|not allowed|invalid/i` for forbidden flags/roots, or `/secret|blocked|refused|sensitive/i` for a secret-containing query
- Never throws for jg failures — returns `{ row: { fallback: true, ... } }` instead

`scripts/hooks/bash-guard.mjs`:
- Reads one JSON line `{ tool_name, tool_input: { command }, session_info?: { cwd? } }` from stdin
- Exits `2` and prints a reason when command matches `/(^|\s)jg\s/` (and isn't `node scripts/jg.mjs`)
- Exits `0` to allow otherwise

## Failed calls

- None.

## Worktree receipt

- Path: `/home/dhertzell/dsd-80-qa`
- Clean: yes (only the two test files committed; nothing staged or dirty)
