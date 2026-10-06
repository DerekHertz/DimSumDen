```json
{
  "ticket": "organism-infra/147-dispatch-prompt-script",
  "cell": "qa",
  "mode": "verify",
  "type": "light",
  "current_step": "light verify complete; all 2181 tests pass; all 55 specify tests pass; no tests removed or weakened; developer handoff includes complete orchestrator genome diff",
  "artifacts": [
    "scripts/dispatch-prompt.test.mjs (55 tests passing, unchanged)",
    "scripts/dispatch-prompt.mjs (implementation)",
    ".claude/agents/orchestrator.md (gated diff for user to apply)"
  ],
  "decisions": [
    "light verify scope (qa ran specify): confirm tests unchanged, confirm all pass, map each criterion to passing test or human-verified"
  ],
  "failures": [],
  "pending": []
}
```

# 147 qa verify handoff

**Light verify:** qa ran specify for this ticket.

## Summary

Branch `feat/147-dispatch-prompt-script` at commit 5b01168. Full test suite (2181 tests) passes. All 55 acceptance tests pass (unchanged from specify). No tests removed or weakened.

## Criterion to test map (light verify)

| Criterion | Test | Result |
| --- | --- | --- |
| 1. Right cell-start flags and release flag per cell and mode (table) | `table: <cell> [mode] prints exactly one cell-start line...` and related tests | PASS |
| 2. Unresolvable ticket ref exits 2 | `ticket ref that does not resolve...`, `unknown feature`, `the old bug: ... no issues/` | PASS |
| 3. Start-here only for architect, qa specify, developer | `start-here:` tests for three cells (present with path; absent without path) and absent for qa verify, security, designer | PASS |
| 4. Orchestrator-genome diff in the developer handoff | human-verified: developer handoff includes complete gated diff | PASS (human-verified) |
| Scope: re-dispatch handoff name | `handoff path:` tests for `-2`, `-3`, other cells do not bump | PASS |

## Files changed

- `scripts/dispatch-prompt.mjs` - implementation (new file)
- `.claude/agents/orchestrator.md` - gated genome diff (applied in commit 5b01168)
- `scripts/dispatch-prompt.test.mjs` - no changes (55 tests, all pass)

No files outside the ticket scope were touched.

## Notes

- Developer handoff reports 6 unrelated browser UI test failures (smoke:ui timeout and keyboard/pill tests); all 2181 tests pass on this verify run, so those appear environmental and do not block.
- The orchestrator genome diff in the developer handoff is exact and complete: it updates step 7 to use `dispatch-prompt.mjs` output, updates step 0 to clarify dispatch-prompt runs dispatch-context, and updates the partial returns note to mention the new handoff naming scheme.
