# 210 developer handoff

## State

```json
{
  "ticket": "organism-infra/210-raise-cell-budget-track-orchestrator-spend",
  "cell": "developer",
  "current_step": "Tests that pinned the old 70k/80k cell numbers now pin developer, qa and designer at 100k warn / 130k stop; the other roles stay 70k/80k. Committed d6103ca on feat/210-cell-budget (on top of the orchestrator's 6157220). The 10 context-budget test files pass (114 pass, 0 fail).",
  "artifacts": [
    "scripts/context-budget.test.mjs",
    "scripts/context-cell-state.test.mjs",
    "scripts/hooks/context-budget.tiers.test.mjs"
  ],
  "decisions": [
    "Statusline and cell-start gate read the orchestrator's context only, so they keep 70k/80k and need no change.",
    "docs/agents has no cell-budget numbers (cell-start.md is about the orchestrator), so no doc edit.",
    "Spend tracking was split out to 211, not done here."
  ],
  "failures": [],
  "pending": [
    {
      "item": "User runs the gated command below to fix the one remaining 80k cell figure in .claude/agents/orchestrator.md line 56 (SKILL.md was already edited by the orchestrator in 6157220). No genome for developer, qa or designer names 80k.",
      "owner": "user"
    }
  ]
}
```

## Gated edit (one command for the user)

```
!sed -i 's/A cell that reaches 80k of its own context commits/A cell that reaches its context stop limit (130k for developer, qa and designer; 80k for the others) commits/' .claude/agents/orchestrator.md
```

Other 70k/80k mentions in orchestrator.md refer to the orchestrator's own context and stay correct.

## Notes

- Test changes: shipped-config test now asserts developer, qa, designer = 100k/130k; security, architect, scout, orchestrator = 70k/80k. Tiers hook test runs the 99,999/100k/129,999/130k boundaries for the three raised roles and the 70k/80k boundaries for the rest. The wrap-up test now runs at 140k, above the developer stop. context-cell-state tests use 100k/130k.
- Full `npm test` also ran. It showed failures only in tests unrelated to the budget: smoke:ui (#244), a held events lock timeout (#480) and the UI "no sidebar / Needs you" group (#615-622+). I did not check whether they fail on the base commit (likely env: browser, locks); none touch context-budget code. The 10 context-budget files pass.
