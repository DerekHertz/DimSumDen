```json
{
  "ticket": "organism-infra/165-context-budget-hook-hardening",
  "cell": "developer",
  "current_step": "PARTIAL (batch C). All three 165 fixes are written in scripts/hooks/context-budget.mjs and committed as a WIP commit on feat/batch-c-context-budget (parent b1c8093, the qa tests). Not run: the live 80k hook stopped me before any test run.",
  "artifacts": ["scripts/hooks/context-budget.mjs"],
  "decisions": [
    "1: a backslash outside single quotes makes isSimpleCommand false",
    "2: wrap-up write only under <main>/.scratch/ or the session scratchpad; main = $ORGANISM_ROOT, else first entry of git worktree list from the call's cwd",
    "3: session_id must match /^[\\w.-]+$/ and not be only dots, else readContextTokens returns null (fails open)",
    "See 145-developer.md for the whole batch"
  ],
  "failures": ["No test run yet"],
  "pending": [
    {
      "item": "Run scripts/hooks/context-budget.hardening.test.mjs and the two edited 162 files, fix any red, then the full suite via scout; final 165 handoff and release in-review (see 145-developer.md pending list)",
      "owner": "developer"
    }
  ]
}
```

## State
Partial; same branch and handoff as 145-developer.md.
