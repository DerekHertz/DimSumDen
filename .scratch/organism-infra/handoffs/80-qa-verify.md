```json
{"ticket": "organism-infra/80-jg-guard-and-scout-opt-in", "cell": "qa", "mode": "verify",
 "current_step": "QA pass — 1051/1051 pass, all 21 specify criteria covered, 5 files all in ticket scope",
 "artifacts": ["scripts/jg.test.mjs (14 specify tests, ok 800-813, all pass)", "scripts/hooks/bash-guard.jg.test.mjs (7 specify tests, ok 662-668, all pass)", "scripts/jg-wrapper.test.mjs (11 developer tests, ok 789-799, all pass)"],
 "decisions": ["Specify test files unchanged — empty diff from cacf054 to 43881f1", "Developer tests add edge cases (version floor, worktree roots, all-caller-flags refusal, query starting with dash, zero-files fallback, disk row, bash-guard path/separator/non-Bash edges) without weakening specify", "All 5 files in ticket scope — no out-of-scope changes", "AC5 human-verified: concrete genome line in 80-developer.md ready for user to apply"],
 "failures": [],
 "pending": [{"item": "security review (risk-check hit: spawn, secrets, board import)", "owner": "security"}, {"item": "user applies scout genome line from 80-developer.md", "owner": "user"}]}
```

## Summary

**Verdict: QA pass**

All tests pass. Specify tests intact. Every acceptance criterion covered.

## Test results (saved run /tmp/80-tests.txt)

- **Total:** 1051 pass, 0 fail, 0 skipped, 0 cancelled
- **Specify tests (jg.test.mjs):** ok 800–813 (14 tests) — all pass
- **Specify tests (bash-guard.jg.test.mjs):** ok 662–668 (7 tests) — all pass
- **Developer tests (jg-wrapper.test.mjs):** ok 789–799 (11 tests) — all pass

## Specify test diff (cacf054 → 43881f1)

```
git diff cacf054 43881f1 -- scripts/jg.test.mjs scripts/hooks/bash-guard.jg.test.mjs
(empty — no changes)
```

No assertions removed or loosened.

## Criterion-to-test map

| Criterion | Test | File | Result |
|---|---|---|---|
| AC1 — always passes `--exclude '.scratch/'` | `runJg always passes --exclude '.scratch/' to run` | `scripts/jg.test.mjs` | ok 800 |
| AC1 — always passes `--exclude '.claude/'` | `runJg always passes --exclude '.claude/' to run` | `scripts/jg.test.mjs` | ok 801 |
| AC1 — refuses `--hidden` | `runJg refuses the forbidden flag --hidden` | `scripts/jg.test.mjs` | ok 802 |
| AC1 — refuses `--no-ignore` | `runJg refuses the forbidden flag --no-ignore` | `scripts/jg.test.mjs` | ok 803 |
| AC1 — refuses `--include-sensitive` | `runJg refuses the forbidden flag --include-sensitive` | `scripts/jg.test.mjs` | ok 804 |
| AC1 — refuses `--include-dependencies` | `runJg refuses the forbidden flag --include-dependencies` | `scripts/jg.test.mjs` | ok 805 |
| AC1 — refuses root inside `.scratch/` | `runJg refuses a root inside .scratch/` | `scripts/jg.test.mjs` | ok 806 |
| AC1 — refuses root inside `.claude/` | `runJg refuses a root inside .claude/` | `scripts/jg.test.mjs` | ok 807 |
| AC2 — bash-guard blocks raw `jg` | `bash-guard blocks a direct 'jg' call (raw binary)` | `scripts/hooks/bash-guard.jg.test.mjs` | ok 662 |
| AC2 — bash-guard blocks `jg` with subpath root | `bash-guard blocks 'jg' with a subpath root` | `scripts/hooks/bash-guard.jg.test.mjs` | ok 663 |
| AC2 — bash-guard blocks `jg --hidden` | `bash-guard blocks 'jg' with --hidden flag` | `scripts/hooks/bash-guard.jg.test.mjs` | ok 664 |
| AC2 — bash-guard blocks `npx jg` | `bash-guard blocks 'jg' run through npx` | `scripts/hooks/bash-guard.jg.test.mjs` | ok 665 |
| AC2 — bash-guard allows `node scripts/jg.mjs` | `bash-guard allows 'node scripts/jg.mjs' (the approved wrapper)` | `scripts/hooks/bash-guard.jg.test.mjs` | ok 666 |
| AC2 — bash-guard allows wrapper with subdir root | `bash-guard allows 'node scripts/jg.mjs' with a subdirectory root` | `scripts/hooks/bash-guard.jg.test.mjs` | ok 667 |
| AC2 — unrelated commands pass through | `bash-guard exits 0 (allow) for an unrelated single command (rg search)` | `scripts/hooks/bash-guard.jg.test.mjs` | ok 668 |
| AC3 — sk-style secret refused before run() | `runJg refuses a query containing a secret (sk-style key) without calling run` | `scripts/jg.test.mjs` | ok 808 |
| AC3 — AWS key refused before run() | `runJg refuses a query containing an AWS access key without calling run` | `scripts/jg.test.mjs` | ok 809 |
| AC3 — clean query passes through | `runJg does not refuse a plain query with no secret` | `scripts/jg.test.mjs` | ok 810 |
| AC4 — successful call logs a row | `runJg returns a row with kind:'jg', queryLen, filesReturned, fallback:false, ms` | `scripts/jg.test.mjs` | ok 811 |
| AC4 — non-zero exit → fallback:true, no throw | `runJg exits cleanly when run() returns non-zero exit (scout fallback)` | `scripts/jg.test.mjs` | ok 812 |
| AC4 — throws → fallback:true, no throw | `runJg exits cleanly when run() throws (scout fallback)` | `scripts/jg.test.mjs` | ok 813 |
| AC5 — scout genome line | **human-verified** — concrete line in `80-developer.md`; user applies | — | ✓ |

## Developer's jg-wrapper.test.mjs assessment

11 tests (ok 789–799) covering edges not in specify:
- **ok 789** — row persisted to disk (usageRoot), correct shape
- **ok 790** — refused call still logs a row with `refused` field
- **ok 791** — all caller flags refused, not only the forbidden four (developer decision per 67)
- **ok 792** — query starting with `-` refused (prevents jg parsing it as a flag)
- **ok 793** — zero files returned → fallback `no-files`, no stdout
- **ok 794** — worktree root under `.claude/worktrees/` allowed; `.claude/` root refused
- **ok 795** — root outside checkout refused; subdirectory allowed
- **ok 796** — missing root refused
- **ok 797** — jg < 0.6.0 / unreadable version → fallback `jg-version`, no run
- **ok 798** — guard blocks jg by path, package name, after separator
- **ok 799** — guard allows searching *for* "jg" in source; non-Bash tool_name bypassed

None of these weaken specify tests. All test real behavior via the injected `run` seam.

## Files changed (05c1240 → 43881f1)

| File | Scope |
|---|---|
| `scripts/jg.mjs` | In scope — the wrapper |
| `scripts/hooks/bash-guard.mjs` | In scope — the guard |
| `scripts/jg.test.mjs` | In scope — qa specify tests (unchanged) |
| `scripts/hooks/bash-guard.jg.test.mjs` | In scope — qa specify tests (unchanged) |
| `scripts/jg-wrapper.test.mjs` | In scope — developer tests |

No out-of-scope files.

## AC5 (human-verified) check

The developer handoff (`80-developer.md`) contains a concrete, reviewable genome line:

> Target: `.claude/agents/scout.md`, insert after "- For searches, report the locations found and one line on each."  
> `- For a "where is X / how does Y work" search you may run node scripts/jg.mjs "<question>" [root]`, where root is your checkout or a non-hidden subdirectory of it, with no flags. If it prints `jg: no result`, exits non-zero, or returns nothing useful, fall back to `rg` and say so in one line. Never run `jg` directly.`

This is well-scoped: names the file, insertion point, and content. Matches the specify intent (AC5). Criterion 5 is satisfied as human-verified.

## Comments

**QA pass.** 1051/1051 tests pass, 0 fail, 0 skipped. Specify tests unchanged (empty diff). All 21 testable criteria have named passing tests; AC5 is human-verified with a concrete genome line ready for the user. Developer tests add 11 quality edge-case tests without weakening coverage. Five changed files are all in ticket scope.

Next: security review (risk-check hit).

## Failed calls

- None.

## Worktree receipt

- Path: `/home/dhertzell/dsd-80-verify`
- Clean: yes (no changes in this verify session — read-only work)
