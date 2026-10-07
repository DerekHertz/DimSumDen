# Security review: den-layout/03 at 433e4dd

```json
{
  "ticket": "den-layout/03-real-agents-drive-the-pandas",
  "cell": "security",
  "current_step": "Security pass. Reviewed the diff against origin/main by hand; gitleaks clean; no dependency or .github changes.",
  "artifacts": [".scratch/den-layout/handoffs/03-security.md"],
  "decisions": [
    "Pass: risk-check hit on live-actors.mjs is a false positive on the word board; the file is a pure adapter (no fs, shell, network, or DOM).",
    "Untrusted text (tool.summary, t.title) only reaches bubble/task strings in the pure-JS actor state; no innerHTML, dangerouslySetInnerHTML, eval, or child_process anywhere under apps/ui/src (grep).",
    "No new daemon or network surface; bridge change is a test file only."
  ],
  "failures": [],
  "pending": []
}
```

## Findings

- apps/ui/src/review/live-actors.mjs:40, low: bubble text (`tool.name: tool.summary`) is not length-capped; a long agent-supplied summary could bloat a UI bubble. Not exploitable; any renderer should clamp and render as text.
- apps/ui/src/review/agents.mjs:~263, low: `applyLive` creates and disposes a split panda per extra ticket with no cap; a snapshot with many same-role locks adds meshes. Local single-user, bounded by board size.

## Checks

- gitleaks detect origin/main..433e4dd: 3 commits, no leaks.
- Dependencies: none changed; no lockfile change. `npm ci` audit: 0 vulnerabilities.
- `.github/` and branch protection: untouched.
