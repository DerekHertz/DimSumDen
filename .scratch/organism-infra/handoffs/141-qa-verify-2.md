# 141 qa full verify: pass

```json
{
  "ticket": "organism-infra/141-steering-approvals",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Full verify on feat/141-steering-approvals (6efaaa1): QA pass. Scout ran npm test: 2468 tests, 2468 pass, 0 fail, 0 cancelled, 0 skipped, exit 0. Verdict written with board comment --verdict pass.",
  "artifacts": [
    "apps/bridge/cells/host-approvals.test.mjs",
    "apps/bridge/bridge-auth.test.mjs",
    "apps/bridge/cells/approvals.mjs"
  ],
  "decisions": [
    "The 3 fail and 1 cancelled in 141-qa-verify were browser and smoke timeouts (smoke-ui, floating-cards, proximity-card) under test-lock contention. A clean rerun of the same commit is fully green, so they were load-related, not a regression.",
    "bridge-auth.test.mjs:332-333: POST /approvals/abc became a real route (POST /approvals/:id). Replacing it with POST /approvals and POST /approvals/abc/extra keeps the default-deny assertion unchanged and still covers 404 for unknown shapes. Not weakened.",
    "host-approvals.test.mjs:45 and :414: the AWS key and the bearer text are built at runtime. The runtime values are identical and no assertion changed, so the masking test (criterion 4) is not weakened.",
    "Read approvals.mjs: the store only denies on its own, never allows; allow needs a prior read (seen) and a claim before any await, so racing decisions are single-winner. Tests exercise the public routes with the fake runtime, not mocks of internals."
  ],
  "failures": [],
  "pending": [
    {"item": "npm run risk-check, then security if it hits. Security may judge the runtime-built secret strings in host-approvals.test.mjs:45 and :414.", "owner": "orchestrator"},
    {"item": "ADR 0016 fifth amendment recording the pinned interface and the GET Origin-optional rule", "owner": "architect"}
  ]
}
```

## State

Criterion map (host-approvals.test.mjs): 1 hold, allow and deny: "holding a permission request (criterion 1)"; 2 allow without GET is 409: "allow only after the full input was served (criterion 2)"; 3 expiry, cap and shutdown deny: "fail closed (criterion 3)"; 4 masking and bidi escaping in input, tool.summary and notes: "masking and escaping (criterion 4)". All pass. No human-verified criteria.

Test files diffed against specify commit 18c30d4: only the three edits above, none loosened.

Note on the cap: the 21st request settles the oldest pending approval as cap-exceeded (denies it) rather than refusing the new one. The specify test accepts this; flagged for the orchestrator in case the ADR intends the reverse.

Files outside the ticket's listed scope, not judged: none beyond the bridge cells, routes, server and watch files that the ticket's feature needs (apps/bridge/cells/{approvals,host,policy,runtime}.mjs, routes.mjs, server.mjs, watch.mjs, and two test files).

## Failed calls

- Agent (scout) report arrived as an in-session message; no failed calls this round.
