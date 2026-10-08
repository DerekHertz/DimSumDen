# 198 security handoff

## State

```json
{
  "ticket": "organism-infra/198-verify-reads-saved-tests",
  "cell": "security",
  "current_step": "Security pass on a3ead5a (diff origin/main...a3ead5a). No critical or high findings; two low notes.",
  "artifacts": [],
  "decisions": [
    "Pass: gitleaks over origin/main..a3ead5a found no leaks; no dependency, lockfile or .github changes."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Orchestrator: open PR and merge on green; .claude/agents/orchestrator.md change is also in the gated patch (qa noted)",
      "owner": "orchestrator"
    }
  ]
}
```

## Review

Scope: scripts/dispatch-prompt.mjs, scripts/jev.mjs (readTests now exported), scripts/dispatch-prompt-tests-flag.test.mjs, .claude/agents/orchestrator.md.

- The `--tests` path goes through the existing `readTests` check (lstat symlink refusal, denied-path check on path and realpath, O_NOFOLLOW open, regular-file check, 1 MB cap). The file is only validated; its content is never printed, executed or passed to a shell. No spawn with the path.
- Importing jev.mjs from dispatch-prompt.mjs is safe: jev's `main` is behind a realpath argv guard, so no side effects on import.
- `--tests` is rejected for anything but qa verify (exit 2).
- No secrets (gitleaks, 3 commits, no leaks). No dependencies, lockfile or workflow changes.

## Comments (findings)

- scripts/dispatch-prompt.mjs:158, low: the printed path is interpolated into a prompt line unescaped, so a filename with a newline could add a line to the dispatch prompt. The orchestrator chooses the path, so no untrusted source reaches it. No fix needed.
- scripts/dispatch-prompt.mjs:119-127, low: check-then-use gap between the exposure check and qa reading the file (the file could change in between). Local /tmp file chosen by the orchestrator; negligible.

Security pass
