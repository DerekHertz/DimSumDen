# 167 security review

Verdict: Security pass. Branch tip 7247e95 (diff origin/main...HEAD: usage-claude.mjs, statusline.mjs comment, two tests).

```json
{
  "ticket": "organism-infra/167-usage-429-backoff",
  "cell": "security",
  "current_step": "Security review done: pass, no critical or high findings; two low notes.",
  "artifacts": [],
  "decisions": [
    {"decision": "Security pass", "why": "gitleaks clean on origin/main..7247e95; npm audit 0 vulns; no dependency or workflow change; token never written to cache; tests use temp HOME and a fetch preload, no network, no shell"}
  ],
  "failures": [],
  "pending": [
    {"item": "Optional: orchestrator proceeds to PR and merge on green CI", "owner": "orchestrator"}
  ]
}
```

## Findings

- scripts/usage-claude.mjs:209 low: stale-lock cleanup is stat-then-unlink, so two waiters can race and one can delete a lock freshly taken by a third, briefly allowing a second network call. Only after a lock older than 30 s (fetch timeout is 10 s), so rare and harmless (extra call, not a leak).
- scripts/usage-claude.mjs:40-51,64 low: cache windows are read from ~/.claude/usage-cache.json and spread into stdout without shape checks. The file is user-owned (written 0600), so no trust boundary is crossed; a corrupt file yields odd output, not code execution.

## Checked, no issue

- Token: sent only to api.anthropic.com; cache holds windows, at, cooldown_until only; errors are sanitized (no response body, no token); tests assert the token is absent from stdout, stderr and every file under HOME.
- Cache write: tmp file plus rename, mode 0600; lock uses O_EXCL ("wx"), so it does not follow symlinks.
- Retry-After capped at 3600 s; negative or garbage values fall back to 300 s.
- No new listener or daemon exposure; no shelling out in the production code. Test spawns use fixed argv, no shell.
- Dependencies: none added, lockfile unchanged.
