# 143 security review (round 2): Security pass

Reviewed origin/main...17daee6 by hand (10 files, +811/-4; no package, .github or .claude changes). gitleaks over origin/main..17daee6: 3 commits, no leaks.

```json
{
  "ticket": "organism-infra/143-steering-adapter-process",
  "cell": "security",
  "current_step": "Security pass at 17daee6; no critical or high findings, two low notes",
  "artifacts": [],
  "decisions": [
    "Pass: spawn uses shell:false and a fixed argv from buildClaudeArgs (role and model checked against fixed lists, sessionId must be a UUID); the prompt goes over stdin, not argv",
    "Pass: child env is the buildClaudeEnv allowlist (PATH, HOME, locale, DEN_CLAUDE_BIN); no tokens reach the child",
    "Pass: detached group kill per ADR 0016 amendment 6; exit handler SIGKILLs the group to reap grandchildren; signal() is a no-op after exit and accepts only SIGTERM or SIGKILL",
    "Pass: control requests are validated and deduplicated by the pure half; unknown subtypes and duplicates get an immediate deny; an allow only answers a held request and echoes the original input",
    "Pass: stdout lines capped by the splitter; stderr drained, never parsed or surfaced",
    "Pass: bounded shutdown wait falls back to killAllSync, and a late spawn is terminated by spawnAgent; the process exit hook also calls killAllSync",
    "Pass: tests bind 127.0.0.1 only; no new network exposure; no new dependencies"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Low, optional: claude-runtime.mjs:109 SIGKILLs -child.pid after the leader exits; if the group is empty a recycled pid could in theory be a different group's id. Window is negligible; the exitedFlag guard covers later calls.",
      "owner": "developer"
    },
    {
      "item": "Low, optional: host.mjs:289-294 on the timeout path a spawn still in flight when the bridge process exits would leave a detached child; it exits on stdin EOF only if claude honors it. Covered by the late-spawn terminate in spawnAgent while the bridge lives.",
      "owner": "developer"
    }
  ]
}
```

## Findings

- claude-runtime.mjs:109 low: group SIGKILL after leader exit relies on the group still existing; pid reuse risk negligible.
- host.mjs:289 low: late spawn after bridge exit is not reaped by the bridge; only a concern on the timeout path.
- No dependency changes, no secrets, no new listeners.
