# 142 architect: ADR 0016 spike round 2 verdicts and amendment 5

```json
{
  "ticket": "organism-infra/142-steering-adapter-pure",
  "cell": "architect",
  "current_step": "ADR 0016 amended in place, committed 7388c4a on docs/142-adr0016-spike-verdicts (not pushed). No 141/142 code touched.",
  "artifacts": ["docs/adr/0016-ui-steering-channel.md"],
  "decisions": [
    "None of the four round-2 verdicts is usable evidence: S8, S3b and S4b fixtures show init permissionMode auto and user-scope MCP servers, so production --setting-sources project,local was not in effect. No control_request was ever raised (Writes were auto-performed); the S4b sleep was refused by a Bash guard before it ran.",
    "S4b EOF row still informs: a child with a background task does not exit on stdin EOF. SIGTERM/SIGKILL rows are vacuous (no tool in flight).",
    "S6b ran in the right shape (mcp_servers empty) but proves nothing on precedence: .claude/probe.txt was refused by the CLI built-in safetyCheck, allowed.txt refused for unknown cause (no trust stderr captured).",
    "Re-run S8, S4b, S6b (and optional S3b) once with a corrected conformance.mjs that aborts as setup-invalid unless init.permissionMode is default and mcp_servers is empty.",
    "D1 (142) proceeds. D2 (143) waits for the S8, S4b, S6b re-run and builds the process-group spawn meanwhile.",
    "Amendment 5 records the 141 interface: permission-request fake event, states pending/allowed/denied/expired, system denies end expired with a reason, APPROVAL_TTL_MS and APPROVAL_CAP_PER_AGENT, decision audit line, GET /approvals/:id skips Content-Type and checks Origin only when present (6.1 note)."
  ],
  "failures": [],
  "pending": [
    {"item": "Corrected conformance.mjs pass (setup-invalid guard, in-flight tool for S4b, non-.claude deny target for S6b, control run without --settings); user runs it", "owner": "developer, then user"},
    {"item": "security re-review of the amendment plus the S8 re-run result", "owner": "security"},
    {"item": "User acceptance: S8 outcome (c) if it results, EOF-with-background-task finding, S6b trust fact", "owner": "user"},
    {"item": "Unverified: the sleep guard text was not found in repo files; I assumed a user-scope hook. Check ~/.claude hooks.", "owner": "orchestrator"}
  ]
}
```

## State

Docs-only change; no tests run. Context budget (80k) was reached while writing, so there was no second read-through of the ADR diff. The architect did not run `scripts/context.mjs`.

## Failed calls

None.
