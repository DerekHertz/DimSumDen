# 143 architect handoff: ADR 0016 spike round 3 verdicts

Branch `docs/143-adr0016-spike-verdicts` (commit f238c09), one file: `docs/adr/0016-ui-steering-channel.md`, a new "Spike round 3 verdicts" bullet in decision 7. Artifacts: `.scratch/organism-infra/artifacts/106-conformance-2026-10-09/`.

## Verdicts

- **S8 is outcome (c), not unconfirmed.** `evaluateS8` only checks for the nonce within 2 s of the socket write. The CLI queues the message until the running tool call ends, then the child said "The peer session's message contained only the token NONCE..." (S8.jsonl line 11, and the control run). So a user message over the socket reaches the model. Interrupts did nothing (sleep 15 ran to completion). A real pending `can_use_tool` request was answered `allow` over the socket with its real request_id: not honoured (file absent, stdin deny took effect). No bytes were ever sent by the socket. 0600 socket, 0700 dir, same uid.
- **S4b is go, plain.** EOF, SIGTERM (753 ms) and SIGKILL each left 0 tool processes with the tool in flight; control agrees. No process group.
- **S6b no-go is setup-invalid, not real.** The control (no --settings) also refused allowed.txt, as did round 2, so the project-local allow never applied and deny-over-allow was never tested. The evaluator's cause line ("--settings replaced it") is contradicted by the control. The jsonl has no stderr, so trust, the `Write(allowed.txt)` pattern form and settings.local.json loading cannot be told apart.

## What it means for 143

- Kill: child only, no `detached`/group kill. EOF, SIGTERM, SIGKILL escalation stays (background-task EOF finding from round 2 still makes SIGTERM mandatory).
- `capabilities`: approval inbox ON (S8 is (c), not (d)). The "with (d) the inbox is off" branch is not taken.
- Do not assume worktree allow rules apply (more approvals, fails safe); no test asserts deny-over-allow.

## Gates before 143's qa specify

- `security` re-review: S8 outcome (c) (peer-message injection from any same-account process), the evaluator miss, 0600/0700 evidence, round 2 amendment.
- User acceptance: S8 (c) injection residual (6.3), background-task EOF finding, S6b trust fact once re-run.
- 195 security low (absent init skipped by setupProblems; guard checks only permissionMode and mcp_servers) stays open.

## Follow-ups (ticket for the spikes' owner, not 143)

- `evaluateS8`: poll for the nonce until the turn's `result`; re-run the socket control_response probe with a second shape before ruling out (d) for good.
- S6b: report setup-invalid when the control's allowed.txt is absent; save stderr; add an absolute-path or `//path` allow comparison.

## State

```json
{
  "ticket": "organism-infra/143-steering-adapter-process",
  "cell": "architect",
  "current_step": "ADR 0016 round 3 verdicts recorded on docs/143-adr0016-spike-verdicts (f238c09); 143 not implemented; waits on security re-review and user acceptance of S8 (c)",
  "artifacts": ["docs/adr/0016-ui-steering-channel.md"],
  "decisions": ["S8 outcome (c); S4b plain (no process group); S6b setup-invalid, deny-over-allow untested"],
  "failures": ["context budget exceeded (83k) at wrap-up"],
  "pending": [
    {"item": "security re-review of S8 outcome (c)", "owner": "security"},
    {"item": "user acceptance of S8 (c) and background-task EOF", "owner": "orchestrator"},
    {"item": "fix evaluateS8 delayed-effect miss and S6b control check (new spikes ticket)", "owner": "orchestrator"}
  ]
}
```
