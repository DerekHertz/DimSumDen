```json
{
  "ticket": "dimsumden-ui-v0/03-metrics-script",
  "cell": "security",
  "current_step": "security review: pass",
  "artifacts": [
    "feature/dimsumden-ui-v0-03-metrics @ 99a47990fb64"
  ],
  "decisions": [
    "Security pass: no critical/high/medium; 2 low notes",
    "gitleaks clean; no dependency or workflow change"
  ],
  "failures": [],
  "pending": [
    {
      "item": "propose merge (brain gate)",
      "owner": "orchestrator"
    }
  ]
}
```

# Handoff: dimsumden-ui-v0/03-metrics-script (security)

Verdict: Security pass. Branch feature/dimsumden-ui-v0-03-metrics at 99a47990fb64.

## Scope reviewed
Diff origin/main...99a4799: scripts/metrics.mjs (new), scripts/metrics.test.mjs (new). No dependency, lockfile, workflow, or .claude change.

## Checks
- gitleaks (origin/main..99a4799): 2 commits, no leaks.
- metrics.mjs is read-only: it reads .scratch/usage.jsonl and events.jsonl under ORGANISM_ROOT or cwd, prints to stdout. No writes, no network, no shell, no daemon, no locks. Paths are fixed joins; no user-supplied path segments (no traversal).
- metrics.test.mjs: spawnSync uses process.execPath with an argument array (no shell), fixed script path, temp dirs from mkdtempSync in tmpdir. Safe.
- Malformed JSONL lines are skipped; parse is JSON.parse only (no eval).
- Probed `__proto__`, `constructor`, `toString` as a cell name: no prototype pollution.

## Findings
- scripts/metrics.mjs:51-54, low: `acc` is a plain `{}` keyed by row `cell`. A usage row whose cell is `__proto__`, `constructor` or `toString` (on a resolved ticket) makes `a.tickets` undefined and the script throws a TypeError. Crash only; no pollution (confirmed). Fix suggestion: `Object.create(null)` or a `Map` for `acc` and `tokensByCell`, or require `Object.hasOwn`. Non-blocking.
- scripts/metrics.mjs:113-118, low: formatText prints row-derived strings (cell names, usage timestamp) raw to the terminal, so control or escape sequences in a logged cell name could reach the terminal. usage.jsonl is written by the organism's own scripts, so exposure is minimal. The UI consumer (later tickets) must render these as text, never HTML. Non-blocking.

## Note for later tickets
When the daemon/UI serve this JSON, keep the localhost-only bind and render the string fields (cell, tool keys) as text.
