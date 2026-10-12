# 107 qa specify

Branch: `tests/organism-infra-107-steering-slice-2` at `5c34b38` (base `33fdd08`). Light verify applies (specify sha `5c34b38`).

## State

```json
{
  "ticket": "organism-infra/107-steering-slice-2",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed for cancel-while-queued and the hand-over; 25 new tests all red for a missing feature (404 route, missing fake-runtime options). bridge-auth.test.mjs updated and still 160/160 green.",
  "artifacts": [
    "apps/bridge/cells/host-cancel-handover.test.mjs",
    "apps/bridge/bridge-auth.test.mjs"
  ],
  "decisions": [
    "Routes pinned: POST /agents/:id/message/cancel { messageId } and POST /agents/:id/handover (ticket's /cells/... is the existing /agents/... per ADR 0019).",
    "Cancel is a runtime op: optional CellProcess.cancel(messageId) -> Promise<boolean>; no new capability key (claude-process.test.mjs deepEquals the five capabilities).",
    "Criterion 1 'acknowledged' read as the 202 { messageId } ack; no new status. Queued -> applied is already covered by host-message.test.mjs."
  ],
  "failures": [],
  "pending": [
    { "item": "Implement cancel and handover in host.mjs, server.mjs, routes.mjs, runtime.mjs (fake), transcript-view.mjs; ADR 0016 amendment", "owner": "developer" }
  ]
}
```

## Criterion to test map

1. Queued, then acknowledged, then applied (fake runtime): already built and tested in `host-message.test.mjs` ("it is recorded as queued, written to the agent once, and marked applied..." and "the page shows it as yours, queued and then received"). I read "acknowledged" as the 202 `{ messageId }` answer; the shipped design has no separate status (ADR 0016: "a per-message acknowledgement event" is not built). Orchestrator: if you meant a distinct third status, say so before the developer starts.
2. Cancel accepted only while queued: `host-cancel-handover.test.mjs`, describes "cancel a message while it is queued" (success, page note "Cancelled", audit line, queue slot freed, late applied report ignored, only the named message, done-then-cancel ends the agent at once) and "cancel is accepted only while the message is queued" (applied 409, double cancel 409, never sent 409, another agent's 409, too late 409, runtime failure 502, no cancel in process 409, ended or stopping 409, bad input 400/404, no token 401).
3. Resume string shown, never run: describe "hand over..." (agent ends terminated with reason `handed-over`, `resume` = runtime string, only after exit, `spawns.length` stays 1, audit lines, queued message undelivered, 409/404/401) plus "a hand-over through the real runtime" (stub started exactly once, no `--resume` argv, string is `claude --resume <sessionId>`).

`human-verified`: none.

## Pinned interface (full text at the top of the test file)

- Cancel: 200 `{ ok: true }`; same transcript entry resent with status `cancelled`; audit `{ event: "cancel", agentId, ref, messageId, route }`; runtime `cancel` returning false is a 409 (too late), rejecting a 502.
- Handover: 202 `{ ok: true }`; stop sequence; end state `terminated`, reason `handed-over`; audit `{ event: "handover", ... }` before the end line.
- Fake runtime (`runtime.mjs`, developer adds): config `cancel` (default false, gives the process a `cancel`), `cancelTooLate`, `failCancel`, `record.cancelled` (ids), config `handover` (default true).
- UI: `transcript-view.mjs` MESSAGE_NOTES gains `cancelled: "Cancelled"`.
- `routes.mjs` gains two token/mutating rows; `bridge-auth.test.mjs` already has BODIES entries and the fake started with `cancel: true`, so the table-driven auth tests cover both rows as soon as they exist.

## Notes for the orchestrator and developer

- The real Claude runtime has no `cancel` (nothing in the repo shows the CLI can drop a queued stdin message), so on a real agent cancel answers 409 "cannot cancel". Tickets's tests use the fake as it asks; a follow-up spike would decide a real cancel. Developer: do not invent a CLI control request.
- Developer touches `.claude`: no. ADR 0016 needs an amendment (architect gate / orchestrator).
- Not tested (no seam given): UI buttons for cancel and hand-over.
