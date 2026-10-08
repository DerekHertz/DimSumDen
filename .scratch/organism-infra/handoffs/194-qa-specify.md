# 194 qa specify handoff

```json
{
  "ticket": "organism-infra/194-handback-allowed-at-stop",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Tests written and committed on branch tests/194-handback-allowed-at-stop. 3 of 9 fail, for the right reason (the hook refuses SubagentHandback at stop with exit 2); the other 6 pass and lock in unchanged behaviour.",
  "artifacts": [
    "scripts/hooks/context-budget.handback.test.mjs"
  ],
  "decisions": [
    "Seam is the hook CLI (PreToolUse JSON on stdin, HOME fixture transcript), same as context-budget.tiers.test.mjs.",
    "Tool name matched exactly: lookalikes (SubagentHandbackExtra, mcp__x__SubagentHandback, Agent, SendMessage) must stay refused at stop.",
    "All criteria are automated; none are human-verified."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Add SubagentHandback to isWrapUpCall in scripts/hooks/context-budget.mjs (exact tool_name match) so the 3 failing tests pass; optionally mention it in refusalText's allowed list (no test requires it).",
      "owner": "developer"
    }
  ]
}
```

## Criterion map

- At/above stop, SubagentHandback allowed -> failing tests: "SubagentHandback is allowed at and above the stop threshold (architect: 80k, 120k)", "... of the 120k roles (developer, qa)", "... for the 80k roles beyond architect".
- At/above stop, Read/Grep still refused -> "Read and Grep are still refused at and above the stop threshold" (passes now, guards the fix), plus "only the SubagentHandback tool itself is wrap-up ..." and "the existing wrap-up calls and refusals still hold ...".
- Below threshold and orchestrator unchanged -> "below the warn threshold ...", "between warn and stop ...", "the orchestrator session is never gated ..." (pass now, guard the fix).
- Fixtures criterion -> every test builds hook input via run() with a fixture transcript.

## Run

`node --test scripts/hooks/context-budget.handback.test.mjs`: tests 9, pass 6, fail 3 (tests 1 to 3).
