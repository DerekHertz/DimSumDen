# 140 architect: qa's pinned choices checked against ADR 0016 and the 106 split

```json
{
  "ticket": "organism-infra/140-steering-host-core",
  "cell": "architect",
  "current_step": "Reviewed qa's pinned interface. ADR 0016 amended in place (fourth amendment) and the tests tightened to match; both committed at c2d959c on tests/140-steering-host-core (base a068a01). Tests are still red only for missing features. Not pushed. The ADR edit is unmerged and needs the user's approval at merge (ADR change is a pass gate).",
  "artifacts": [
    "docs/adr/0016-ui-steering-channel.md (tests/140-steering-host-core @ c2d959c)",
    "apps/bridge/cells/host-core.test.mjs",
    "apps/bridge/cells/host-sessions.test.mjs",
    "apps/bridge/cells/host-shutdown.test.mjs",
    "apps/bridge/cells/host-test-helpers.mjs"
  ],
  "decisions": [
    "Process interface: ADR amended. stop() becomes closeInput(), signal('SIGTERM'|'SIGKILL') (synchronous) and exited (never rejects). The host owns the grace periods and the order; terminated is set only after exited; the exit handler needs a synchronous SIGKILL. Process-group kill (S4b) lives inside the adapter's signal().",
    "resumeCommand moved from the process to the runtime (resumeCommand(sessionId) -> string). A replayed agent has no process, and this keeps every 'claude --resume' string inside the adapter (the ADR rule that nothing outside claude-adapter.mjs names a Claude flag). No runtime means resume null. Tests now compare against runtime.resumeCommand(), not a literal.",
    "Names: role, /agents, snapshot key agents, change {type:'agent', agent: object|null} are ADR 0019 decision 10 applied; ADR 0016 recorded as 'Names as built'. Agent ids keep the c- prefix (16 hex), approvals stay a-; test regex tightened from [a-z]- to c-.",
    "startBridge({runtime, policy}) returning host:{start, shutdown}: ADR amended. No default runtime until D2, so a runtime-less bridge answers 503. policy is test-only; sessionCap can only lower the hard 8 cap (min), never raise it (test now passes sessionCap:100 and still expects 8).",
    "Process-level handlers owned by startBridge: accepted and recorded, with three added rules: installed only when a runtime is given (existing runtime-less tests touch no process state), shutdown() idempotent, the uncaughtException handler writes the error to stderr and exits non-zero. New tests for each.",
    "Status codes recorded as a table in decision 3: 201, 202 (stop), 400, 404, 409, 429 (concurrency, 8-cap, usage >= 90), 503 (no runtime or shutting down), 5xx (spawn failure). usageUnknown:true on a null reading.",
    "mode is an allowlist (specify, verify, review, spec, critique, direction), else 400: it is a client string that reaches the prompt template (ADR decision 3: only validated fields). New test. Not cross-checked against role in slice 1.",
    "herald is a known role that decision 3 does not list for slice 1: refused 409 (fail closed), distinct from the relay-hop wording. New test. See question 1.",
    "sessions.jsonl route field is 'start()' for the internal entry, so a reviewer can tell a relay-runner start from a click (ADR decision 11). New test; line schema recorded in decision 4.",
    "Checked and left alone: 429 for caps and usage, 503, 202; the {ref, role, mode?} body; the 4 KB cap and Origin/Content-Type gate on stop; bridge-auth.test.mjs table rows; the risk-check .claude/** tests (match ADR 6.10 and the 106 split row C1)."
  ],
  "failures": [],
  "pending": [
    {"item": "Make the tests pass. Notes beyond qa's handoff: runtime has resumeCommand(sessionId); fake contract and CellProcess per host-core.test.mjs header; cwd in 140 is the main checkout and the prompt a minimal fixed template of validated ref, role and mode (worktree creation and the real template are not in 140)", "owner": "developer"},
    {"item": "Unassigned by the ADR build order, the 106 split and ticket 140: (a) the bridge appending the dispatch-approve audit line to requests.jsonl after POST /agents (ADR decision 3); (b) worktree creation and the real prompt template for non-relay roles (decision 3). Assign them (likely D2 or a small follow-up) or drop them", "owner": "orchestrator"},
    {"item": "User approves the ADR 0016 fourth amendment at merge (ADR gate); nothing pushed", "owner": "user"}
  ]
}
```

## State

The ADR said little about the process interface, status codes, names and handler ownership, so qa pinned them in tests. Each is now either in the ADR (amendment 4, in place, marked) or the test was changed to follow the ADR. Head SHA on `tests/140-steering-host-core`: **c2d959c6b46d227d353633b9d993ce8c3fef7b38**. I ran the five touched test files: 123 tests, 56 pass (the older bridge tests), 67 fail, all for a missing feature (`runtime.mjs` absent, `bridge.host` undefined). Not validated against a reference implementation, as with qa.

## Questions for the user (not decided here)

1. **Herald dispatch.** ADR 0016 decision 3 lists orchestrator, architect, product, designer and scout for slice 1 and omits `herald`, though it is one of the nine roles. I made it 409 (fail closed). Should the UI ever dispatch herald? Flip is one line plus one test.
2. **The dispatch gate limits the route to one agent at a time in practice.** Decision 3 requires `gate == "dispatch"`, and the snapshot gives that gate only to `frontier[0]` when no ticket anywhere holds a lock (`apps/bridge/snapshot.mjs`). Once an agent claims a ticket, no ref has the gate, so a second `POST /agents` is 409 before the cap-2 check can fire. The cap is reachable by `start()` (the relay runner) and in the window before the first claim. This is ADR 0011 and 0016 as written, not a 140 defect; say if the precondition should change for non-relay roles.

## Failed calls

- Bash, a `node <<EOF` heredoc script: rejected by the worktree isolation guard ("too complex to verify"). Wrote the script with Write and ran it. Genuine guardrail, already in the protocol.
