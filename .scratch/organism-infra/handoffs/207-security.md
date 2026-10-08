# 207 security review: Security pass

```json
{
  "ticket": "organism-infra/207-dispatch-prompt-prints-verify-mode",
  "cell": "security",
  "current_step": "Reviewed origin/main...a1f6906 (3 files). Security pass, no findings of any severity.",
  "artifacts": [],
  "decisions": [
    "No shell-out added; the new line is a printed string only.",
    "Ticket ref is validated by parseArgs regex before it reaches the path join; the handoff stem is regex-escaped."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Open PR and merge on green CI",
      "owner": "orchestrator"
    }
  ]
}
```

## Scope reviewed

- scripts/dispatch-prompt.mjs: maxHandoff / verifyModeLine. Reads a directory listing under the main checkout's .scratch/<feature>/handoffs. `feature` and `slug` come from a ref matching `^[\w.-]+/[\w.-]+$` with no dot-leading segments, so no path traversal. Output is printed text, never executed.
- .claude/agents/qa.md: wording only (already applied by gated patch). It does not widen tool access.
- scripts/dispatch-prompt-verify-mode.test.mjs: tests only.
- gitleaks over origin/main..a1f6906: 3 commits, no leaks.
- No dependency or package.json / lockfile change; no workflow change.

## Notes (informational, not findings)

- The light/full decision trusts the presence of a handoff file. A stale or hand-made specify handoff would pick light verify. That is a cost/rigor choice, not a security boundary; the board refuses overwrites and handoffs publish only via `board handoff`.
- A plain `git diff origin/main` shows .scratch deletions because main moved; the three-dot diff is clean.
