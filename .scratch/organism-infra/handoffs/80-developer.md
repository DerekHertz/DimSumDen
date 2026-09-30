```json
{"ticket": "organism-infra/80-jg-guard-and-scout-opt-in", "cell": "developer", "current_step": "implemented on dev/80-jg-guard-and-scout-opt-in @ 43881f1; qa's 21 tests pass, npm test 1051/1051; risk-check hits (security needed)",
 "artifacts": ["scripts/jg.mjs", "scripts/hooks/bash-guard.mjs", "scripts/jg-wrapper.test.mjs"],
 "decisions": ["Wrapper refuses every caller flag, not only the forbidden four (67: never forward caller flags)", "Dot-directory root check is relative to the nearest .git ancestor, so worktrees under .claude/worktrees/ still work; CLI also refuses roots outside git rev-parse --show-toplevel", "jg < 0.6.0 or unreadable version falls back as reason jg-version (a missing jg shows up this way too)", "Zero files returned counts as fallback (reason no-files); refused calls also log a row with refused:<flag|root|query|secret>", "bash-guard prints the block reason to stdout (qa contract) and stderr (Claude Code reads stderr on exit 2)"],
 "failures": [],
 "pending": [{"item": "full security review (risk-check hit: spawn, secrets, board import)", "owner": "security"}, {"item": "user applies the scout genome line below; bash-guard registration in .claude/settings.json is ticket 52's gated step", "owner": "orchestrator"}]}
```

## State
Done, pending security review and the user's genome edit.

## What changed
Branch `dev/80-jg-guard-and-scout-opt-in`, commit `43881f1` on top of qa's `cacf054`.
- `scripts/jg.mjs`: `runJg({ query, root, extraArgs, run, now, usageRoot, checkout, version })` per qa's seam, plus a CLI `node scripts/jg.mjs "<question>" [root]`. Always passes `--exclude .scratch/ --exclude .claude/`. Checks the query with `exposure.mjs` `hasSecret`. Exit 0 on success or fallback (prints `jg: no result (<reason>); fall back to rg`), exit 2 on refusal. Rows go to the main checkout's `.scratch/usage.jsonl` through board-service `appendUsageLine`.
- `scripts/hooks/bash-guard.mjs`: jg rule only (raw `jg`/`jevgrep` in command position, bare or by path). Exports `check(input)` and a `RULES` list that ticket 52 can extend.
- `scripts/jg-wrapper.test.mjs`: 11 developer tests (row on disk, refused rows, caller flags, worktree vs. `.claude/` roots, out-of-checkout roots, version floor, guard edge cases).

## Scout genome edit (user applies; `.claude/` is gated)
Target: `.claude/agents/scout.md`, insert after the bullet "- For searches, report the locations found and one line on each.":

```
- For a "where is X / how does Y work" search you may run `node scripts/jg.mjs "<question>" [root]`, where root is your checkout or a non-hidden subdirectory of it, with no flags. If it prints `jg: no result`, exits non-zero, or returns nothing useful, fall back to `rg` and say so in one line. Never run `jg` directly.
```

## Decisions made
See the State block. Row shape is qa's (`kind, ts, queryLen, filesReturned, fallback, ms`) plus `reason` or `refused`. It shares `kind:"jg"` with ADR 0014's dispatch-time rows, which have different fields; a report must tell them apart by fields (e.g. `ticket` present only in 0014 rows).

## Next step
security: full review of `43881f1` (risk-check hit). Then the orchestrator opens the PR.

## Suggested skills
organism-protocol, code-review.

## Gotchas
- The jg rule is inert until `bash-guard.mjs` is registered as a PreToolUse hook in `.claude/settings.json` (ticket 52's gated step). Scout may also need a permission allow entry for `node scripts/jg.mjs`.
- The wrapper can only record fallback for jg failures and zero-file results. When scout discards a non-empty result as unhelpful, no row says so; the genome line asks scout to report it in its reply instead.
- The guard is a string check; shell indirection can bypass it (residual Low, per 67).
