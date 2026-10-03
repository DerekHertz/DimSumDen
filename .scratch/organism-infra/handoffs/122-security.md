# 122 security

Branch `feat/122-new-session-per-ticket`, commit `ce80a9c`. Verdict: Security pass.

```json
{
  "ticket": "organism-infra/122-new-session-per-ticket",
  "cell": "security",
  "current_step": "Reviewed diff against origin/main (package.json, scripts/next-session.mjs, scripts/next-session.test.mjs). Security pass, no blocking findings.",
  "artifacts": [],
  "decisions": [
    {"decision": "Pass", "why": "spawnSync with an argv array and no shell; printed command is POSIX single-quoted correctly; handoff names are regex-constrained; no new dependency; gitleaks clean."}
  ],
  "failures": [],
  "pending": [
    {"item": "Orchestrator opens the PR and merges on green CI.", "owner": "orchestrator"}
  ]
}
```

## Findings

- `scripts/next-session.mjs:70` spawnSync("claude", [...]) with no `shell` option: the prompt is one argv entry, so nothing is parsed by a shell. Not a finding.
- `scripts/next-session.mjs:13,31` file name enters the prompt only if it matches `^YYYY-MM-DD-orchestrator[-cloud]-<digits>.md$`, so a crafted file name cannot inject text. Symlinks are skipped (`isFile()` on a Dirent). Not a finding.
- `scripts/next-session.mjs:41,65` `--root` and `$ORGANISM_ROOT` are interpolated into the prompt text. Both are operator-supplied, not agent or web text, and `path.resolve` makes them absolute. Residual: a root with odd characters becomes prompt text for the same user's own claude session. Low, informational, no action.
- `scripts/next-session.mjs:45,74` printed command: probed by hand with a root containing `$(touch ...)`, backticks, a single quote, a double quote and spaces. Pasted into `sh`, the quoted argument came back byte-identical and the side-effect file was not created. Not a finding.
- `scripts/next-session.mjs:70` `claude` resolves via PATH (normal for a launcher; a hostile PATH is already game over). Low, informational.
- `scripts/next-session.test.mjs` uses mkdtemp dirs, cleans them with rmSync, and stubs `claude` through PATH. No network, no real claude spawn, no writes outside tmp.
- Dependencies: none added; package.json adds only the `next-session` script line. Lockfile unchanged.
- Secrets: `gitleaks detect --log-opts="origin/main..ce80a9c"` scanned 2 commits, no leaks.

## Not reviewed

The gated genome patch (`.claude/agents/orchestrator.md`) is not on this branch; qa verified it landed in main. It is prose only.
