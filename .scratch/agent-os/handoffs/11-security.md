# Security review: agent-os/11 at 4fe958c

Verdict: Security pass. No critical, high or medium findings.

```json
{
  "ticket": "agent-os/11-main-git-rule-followups",
  "cell": "security",
  "current_step": "Security pass at 4fe958c; risk-check hit was the new test file's child_process import only",
  "artifacts": [".scratch/agent-os/handoffs/11-security.md"],
  "decisions": [
    "Fail-closed throw in claude-runtime.mjs is placed before spawnChild, so no process starts; host maps it to 502 with worktree removed and reservation released",
    "Defence in depth confirmed: compileCeiling in claude-adapter.mjs (line 221) also throws on a non-plain mainGit"
  ],
  "failures": [],
  "pending": []
}
```

## Scope

Diff origin/main...4fe958c: `apps/bridge/cells/claude-runtime.mjs` (+5/-1) and new `apps/bridge/cells/main-git-failclosed.test.mjs`. Two commits.

## Checks

- risk-check: 1 hit, `main-git-failclosed.test.mjs` (execFile for git/stub binary in tmp fixtures). Test-only; no production shell-out added.
- gitleaks `origin/main..4fe958c`: 2 commits, no leaks.
- No dependency, lockfile, workflow or network-binding change. npm ci audit: 0 vulnerabilities.
- Fix: `mainGit !== undefined && !isWorktreePath(mainGit)` throws before `spawnChild`. The ceiling now passes `mainGit` unfiltered, so the adapter's own check is a second guard. The host catches the rejection in `spawnAgent` (host.mjs 331-337), removes the worktree, releases `liveByRef`, answers 502. Closes the 09 medium finding.
- Test file: temp dirs via mkdtemp, rm only on those; no writes to the real repo or board.

## Findings

- Low, `apps/bridge/cells/claude-runtime.mjs:62`: `mainGit === undefined` still spawns without the denies. The only caller (host.mjs 324) always passes it after `prepareMainGit`, so it is not reachable today. Consider requiring mainGit for walled roles when agent-os/03 adds callers. Not blocking.
- Low (carried from 09, not ticketed by the user): `publish` unsandboxed `rev-parse HEAD`, and `git pack-refs` race in `prepareMainGit`.
