# Security review: batch C (145 + 165) at ed2646a

Verdict: Security pass. Reviewed the diff against origin/main by hand; /security-review was not run. gitleaks (origin/main..ed2646a, 5 commits): no leaks. No dependency, lockfile or workflow changes.

```json
{
  "ticket": "organism-infra/145-cell-context-hook",
  "cell": "security",
  "current_step": "Security pass on batch C (145 and 165) at ed2646a; no critical or high findings.",
  "artifacts": [],
  "decisions": [
    "Pass: backslash rejection in isSimpleCommand closes the quote-escape chain bypass.",
    "Pass: wrap-up Write now allowed only under the main checkout's .scratch (ORGANISM_ROOT or git worktree list), not any path containing /.scratch/.",
    "Pass: session_id validated before reaching context.mjs; budgetFor never throws and uses Object.hasOwn."
  ],
  "failures": [],
  "pending": []
}
```

## Findings (none blocking)

- low, scripts/hooks/context-budget.mjs:26 and .claude/skills/organism-protocol/SKILL.md: the SKILL now tells cells to run `node scripts/context.mjs --self --cell <type>`, but the wrap-up allowlist regex only matches `node scripts/context.mjs` with an optional `--self`. Past the stop number that command is refused. Safe direction (fail closed); a cell at stop needs no reading. Widen the regex only if wanted.
- low, scripts/hooks/context-budget.mjs:52: the session id is interpolated into a RegExp without escaping `.`. The id is validated to `[\w.-]` and comes from the harness, and `.`/`..` ids yield no reading so never reach the wrap-up path. Not exploitable.
- low (informational), scripts/context-budget.mjs:21: `CONTEXT_BUDGET_CONFIG` redirects the config read. It is the test seam and the hook's env is set by the harness, not the cell. Invalid or missing config falls back to the default or built-in 70k/80k, so it fails open as designed. A developer can raise its own budget by editing scripts/context-budget.json, but that edit goes through review.
- low (informational), scripts/hooks/context-budget.mjs:59: `git worktree list` runs with `cwd` from the hook input and a 10 s timeout; no shell, fixed args. A null result only narrows the allowed Write paths.

## Areas checked

- Shelling out: spawnSync with arg arrays, no shell string; session id now validated. cell-start only changes constants.
- Path handling: wrap-up Write path resolved with path.resolve (no `..` escape) and anchored to the main checkout. Symlink resolution is not done; pre-existing and only matters at 80k+.
- Tests: use mkdtemp fixtures, HOME overridden, no network, no writes outside fixtures.
- Not touched: daemon/network exposure, untrusted text to UI.
