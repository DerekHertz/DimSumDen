# 194 qa verify handoff

```json
{
  "ticket": "organism-infra/194-handback-allowed-at-stop",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Full verify done on feat/194-handback-allowed-at-stop at 95eb3b0. QA pass. Full npm test run three times via scout: 2423/2423 each run, 0 fail, 0 skipped. The 9 handback tests pass.",
  "artifacts": ["scripts/hooks/context-budget.mjs", "scripts/hooks/context-budget.handback.test.mjs"],
  "decisions": [
    "Full verify, not light: specify ran in another session (tests/194-handback-allowed-at-stop, specify sha 07ca7f2).",
    "Test file scripts/hooks/context-budget.handback.test.mjs is byte-identical between 07ca7f2 and 95eb3b0 (git diff empty), so no assertion was removed or loosened.",
    "Developer diff is two lines in scripts/hooks/context-budget.mjs (isWrapUpCall allowlist, refusalText). Nothing else touched outside scope.",
    "Criterion map: at/above stop SubagentHandback allowed -> 'SubagentHandback is allowed at and above the stop threshold' tests (architect 80k/95k, developer and qa 120k/150k, security/designer/scout 80k). Read/Grep still refused at stop -> 'Read and Grep are still refused' and 'only the SubagentHandback tool itself is wrap-up'. Below threshold and orchestrator unchanged -> 'below the warn threshold', 'between warn and stop', 'the orchestrator session is never gated'. Fixtures -> every test builds input via run()."
  ],
  "failures": [
    "Developer reported one earlier full npm test run at 2422/2423 with an unnamed failure. Not reproduced: three full runs by scout all passed (2423/2423). Cause still unidentified."
  ],
  "pending": [
    {
      "item": "Non-blocking: no test at 79,999 for architect (below its 80k stop). The fix only adds an allowance, so the below-stop case is already allowed before the change; the boundary is not a blocker.",
      "owner": "developer"
    }
  ]
}
```

Verdict: QA pass. The branch is ready for the orchestrator to run risk-check and open the PR.
