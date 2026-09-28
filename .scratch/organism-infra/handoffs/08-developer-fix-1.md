# Handoff: organism-infra/08 risk-sized review — developer fix round 1

**Ticket:** `.scratch/organism-infra/issues/08-risk-sized-review.md`
**Branch:** `claude/organism-infra-08-risk-sized-review`, commit `d094a0f` (off `cf559a7`)
**Status:** in-review (security bounce round 1 of 2 addressed; not resolved by this cell)

## What I did

Test-first fix for security's three findings plus qa's non-blocking gap, all in `scripts/risk-check.mjs` / `scripts/risk-check.test.mjs`:

1. **HIGH (`risk-check.mjs:44`, option injection):** `main()` now rejects any range argument starting with `-` before calling git, printing a clear error and exiting non-zero. `parseDiff` also passes `--end-of-options` before the range to `git diff` as defence in depth. New test: `--output=<tmp>` exits non-zero, writes no file, and stdout never contains "clean".
2. **MEDIUM (`:33`, shelling-out regex gap):** widened to `\b(spawnSync|spawn|execFileSync|execFile|execSync|fork)\s*\(`. New tests: an `execFileSync(` call added as the only changed line (import already present, unchanged context) is still caught; a second test covers spawnSync/execFile/fork together.
3. **LOW (`risk-check.test.mjs:262` per security's line reference, now the private-key test near line 75):** the PEM header/footer is built at runtime via string concatenation instead of appearing as a literal, so no `-----BEGIN ... PRIVATE KEY-----` string sits in the source.
4. **qa gap:** added dedicated tests for the "board, lock, or daemon code" and "secrets handling" `CODE_RISK_PATTERNS` categories (previously only manually spot-checked).

## Verification

- `node --test scripts/risk-check.test.mjs`: 15/15 pass (10 original + 5 new).
- `npm test`: 61/62 pass. The one failure, `apps/ci-cd/smoke.test.mjs` ("npm run smoke passes a dev page..."), is a pre-existing, unrelated environment gap: `playwright` is not resolvable in this worktree's `node_modules`. Confirmed pre-existing by stashing my changes and re-running `npm test` on the unmodified `cf559a7` tree: same failure, 56/57 pass. Restored my changes afterward via `git stash apply` (stash entry itself could not be dropped — a `git stash list`/`drop` call was blocked by the permission classifier; the entry is harmless and left in the shared stash stack for the user to clear if desired).
- No background processes or servers were started or left running.

## Next

Ready for security's second look (bounce round 2 of 2 budget). Orchestrator holds the ticket lock; I did not touch ticket status or the lock. Full findings/response recorded in the ticket's `## Comments`.
