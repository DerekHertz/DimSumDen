```json
{
  "ticket": "organism-infra/102-context-step-reads-heading-tickets",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify passed: all 1968 tests pass (0 skipped), all 7 [102] tests cover each AC, no tests removed or weakened",
  "artifacts": [],
  "decisions": [],
  "failures": [],
  "pending": [
    {
      "item": "npm run risk-check, then merge",
      "owner": "orchestrator"
    }
  ]
}
```

## State

Done. Branch feat/102-context-step-reads-heading-tickets at 433a06d passes all acceptance criteria.

## What changed

Developer changed only `scripts/dispatch-context.mjs` (commit 433a06d, from qa's specify at aedd62d). The parseTicket function now reads a `## What to build` markdown heading section (up to the next `##` heading) when present, falling back to the bold `**What to build:**` line if the heading is absent.

## Acceptance criteria map

- **AC1**: A ticket with `## What to build` heading has that section's text, nothing from `## Acceptance criteria` or `## Comments` in the jg query → tests [102] AC1 (4 tests at lines 488, 499, 508, 515)
- **AC2**: The bold `**What to build:**` form still works → test [102] AC2 (line 523) + all 1967 existing tests still green
- **AC3**: A heading-form ticket naming two paths triggers the skip → tests [102] AC3 (2 tests at lines 530, 539)
- **AC4**: `npm test` green → ✓ 1968 pass, 0 fail, 0 skipped

## Next step

`npm run risk-check` and merge. Orchestrator owns it.

## Gotchas

None. Developer's handoff was accurate, tests stayed green, no scope creep.
