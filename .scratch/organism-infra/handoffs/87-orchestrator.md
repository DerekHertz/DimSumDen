```json
{
  "ticket": "organism-infra/87-dispatch-context-script",
  "cell": "orchestrator",
  "current_step": "Resolved. Relay done: qa specify, developer, qa light verify (pass), security (pass). PR 119 merged green.",
  "artifacts": ["PR 119", ".scratch/organism-infra/handoffs/87-qa-verify.md", ".scratch/organism-infra/handoffs/87-security.md", ".scratch/organism-infra/issues/92-dispatch-context-hardening.md"],
  "decisions": ["Security M1/L1/L2 filed as ticket 92; M2 (ticket text goes to the jg provider) allowed by ADR 0014."],
  "failures": [],
  "pending": [{"item": "User applies the .claude diff in 87-developer.md (orchestrator Context step), bundled with the 90% edits in one PR", "owner": "user"}, {"item": "Ticket 57: trial the effect of 87", "owner": "orchestrator"}]
}
```

# Handoff: orchestrator, 87

PR 119 merged. The `.claude` edit is still the user's to apply (see 87-developer.md).
