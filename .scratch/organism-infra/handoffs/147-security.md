# Handoff: organism-infra/147 security

Security pass at 5b01168. No critical or high findings.

## State

```json
{
  "ticket": "organism-infra/147-dispatch-prompt-script",
  "cell": "security",
  "current_step": "Security review done: pass. gitleaks clean on origin/main..5b01168, no dependency or CI changes.",
  "artifacts": ["scripts/dispatch-prompt.mjs", "scripts/dispatch-prompt.test.mjs", ".claude/agents/orchestrator.md"],
  "decisions": [
    "spawnSync uses an argv array with no shell, so no injection path into dispatch-context.",
    "Ticket ref is validated by regex and dot-prefix check, so no path traversal into .scratch/.",
    "Pass despite unvalidated --base/--branch/--batch (low): input comes from the orchestrator and is only printed."
  ],
  "failures": [],
  "pending": [
    {"item": "Orchestrator opens PR; note orchestrator.md under .claude/ is edited on the branch (gate for user to confirm)", "owner": "orchestrator"}
  ]
}
```

## Findings

- scripts/dispatch-prompt.mjs:42-71 (low): --base, --branch and --batch values are not validated. They are echoed into a prompt line a cell later runs, so a value with shell metacharacters would be passed through. Input is the orchestrator's own, not untrusted. Optional hardening: restrict to `^[\w./-]+$`.
- scripts/dispatch-prompt.mjs:92 (info): the child is spawned with an argv array, no shell, a 120s timeout, and a validated ref.
- scripts/dispatch-prompt.mjs:116 (info): the ticket path is built from a validated feature and slug. `..` and dotted segments are rejected, so there is no traversal.
- scripts/dispatch-prompt.mjs:75-87 (info): handoffName is a read-only readdir with a regex-escaped stem. It writes nothing, so there is no lock race.
- Network: none. Test file uses mkdtemp temp dirs only.
- .claude/agents/orchestrator.md (process note): changes under .claude/ are a pass gate. Confirm the user approved this edit.
