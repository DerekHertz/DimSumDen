# Handoff: 166 security review

Verdict: Security pass. Branch feat/166-secret-in-root-names-path at caa893f.

```json
{
  "ticket": "organism-infra/166-secret-in-root-names-path",
  "cell": "security",
  "current_step": "Security pass. Diff vs origin/main reviewed by hand, gitleaks clean, changed tests green (136 pass).",
  "artifacts": [],
  "decisions": [
    {"decision": "Pass: secret_path carries only a git-tracked repo-relative path, never contents or matched text; JSON-serialized so no injection into the usage log or printed line", "why": "dispatch-context.mjs finish() and print()"},
    {"decision": "Pass: 8 risk-check hits are false positives; fixtures are fake and built at runtime", "why": "tests only; no shell-out beyond execFile with array args in tmp repos"}
  ],
  "failures": [],
  "pending": []
}
```

## Findings

- No critical, high or medium findings.
- low: scripts/dispatch-context.mjs:115 and :260 a tracked file whose own name looks secret-like would be echoed in the usage row. Accepted: the path is the whole point of the ticket, and it is repo-relative.
- low: scripts/root-secret-scan.test.mjs duplicates the file-set filter (board dirs, binary extensions) from dispatch-context.mjs, so the two can drift. Not a security risk; the guard could silently under-scan if the filter changes.
- No consumer renders secret_path (checked jev-report, jg, jev, requests, App.jsx), so no untrusted text reaches the UI.

## Checks run

- gitleaks detect origin/main..caa893f: 2 commits, no leaks.
- Fixtures: FAKE_AWS_KEY, PRESET_TOKEN and session TOKEN are string-split at runtime; no secret literal in tracked source.
- Tests run: dispatch-context-secret-path, root-secret-scan, dispatch-context, exposure, session, bridge-launch-code: 136 pass, 0 fail, 0 skipped. Full suite not run, per instruction.
- No package, workflow or branch-protection changes; dependency checks not applicable.
