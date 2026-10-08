# 141 qa specify: failing tests for steering approvals

```json
{
  "ticket": "organism-infra/141-steering-approvals",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Tests committed on tests/141-steering-approvals (18c30d4, base d49248f, not pushed). 32 tests in host-approvals.test.mjs: 31 fail for the missing feature (no approvals in the snapshot, no fake-runtime permission requests, no routes), 1 passes (tool.summary masking, a 140 regression guard). bridge-auth.test.mjs gained a POST /approvals/:id body row; its 96 tests still pass.",
  "artifacts": [
    "apps/bridge/cells/host-approvals.test.mjs",
    "apps/bridge/bridge-auth.test.mjs"
  ],
  "decisions": [
    "The pinned interface is in the header of host-approvals.test.mjs: fake runtime emits {type:'permission-request', requestId, tool, input}, records decide() calls in record.decisions, approve capability true; policy APPROVAL_TTL_MS and APPROVAL_CAP_PER_AGENT; startBridge policy.approvalTtlMs (test-only, lower only); approval states pending/allowed/denied/expired; approval field agentId (matches sessions.jsonl); sessions.jsonl 'decision' line; escaped input shown as lowercase \\uXXXX. The ADR needs an amendment recording these (architect or developer with the user's approval).",
    "System denies (expiry, 20-cap, stop, child exit, shutdown) are asserted only as non-pending plus allow:false to a live child; only expiry (state 'expired') and explicit answers have exact states.",
    "Not tested here (D1, adapter): decodeControlRequest on the real nested control_request shape; the host-level equivalent (undecodable fake event denied, duplicate request id denied, unusable request id dropped) is tested."
  ],
  "failures": [],
  "pending": [
    {"item": "Make the tests pass without editing them; extend runtime.mjs fake, policy.mjs, routes.mjs registry (GET and POST /approvals/:id), host/approval store, snapshot approvals and approval change; light verify then runs npm test and diffs the test files against 18c30d4", "owner": "developer"},
    {"item": "Record the pinned interface in ADR 0016 (fifth amendment) at merge", "owner": "architect"}
  ]
}
```

## State

Criterion map:

| Criterion | Tests (host-approvals.test.mjs) |
|---|---|
| 1 Hold, answer allow and deny | "holding a permission request (criterion 1)": pending approval bound to agent, allow, deny, second decision 409, concurrent decisions, SSE `approval` change; plus bad ids and bodies, and "hostile or undecodable requests" |
| 2 Allow without GET is 409 | "allow only after the full input was served (criterion 2)": 409 before GET, no unlock across ids or by an unauthenticated GET, full input served past the 200-char summary |
| 3 Expiry, cap, shutdown deny | "fail closed (criterion 3)": expiry, no double answer after a decision, 20-cap, stop, child exit, shutdown |
| 4 Masking and bidi escaping | "masking and escaping (criterion 4)": served input, approval summary and tool name in /state and SSE, tool.summary, notes in snapshot, sessions.jsonl and the child's reason |
| Auth gate (ADR 6.1) | registry rows test; unauthenticated GET 401 identical for real and bogus id; bridge-auth.test.mjs BODIES row puts POST /approvals/:id in the table-driven auth tests |
| Audit (ADR decision 4) | "the audit line": a decision line, none on a refused allow |

Human-verified: none (no visual criteria; the UI approval card is a separate ticket).

Developer notes: the fake runtime is product code in `cells/runtime.mjs`; I did not touch it. Once `GET /approvals/:id` and `POST /approvals/:id` are registered the bridge-auth table runs its full battery against POST /approvals/:id; its `prepare` expects `bridge.host.start` plus a `permission-request` event to yield an approval within 2 s.

## Failed calls

None.
