# 220 qa specify

Branch: `tests/organism-infra-220-context-budget` (commit 98e5d11, base b951b06). Tests only; no product code.

```json
{
  "ticket": "organism-infra/220-one-context-budget-for-cells",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Tests written and committed; 25 of 4034 fail for the right reason (shipped config still 70k/80k and 130k, statusline holds CTX_LIMIT/CTX_YELLOW, cell-start doc lacks the new numbers). Nothing else fails.",
  "artifacts": [
    "scripts/context-budget-220.test.mjs (new)",
    "scripts/context-budget.test.mjs",
    "scripts/context-cell-state.test.mjs",
    "scripts/hooks/context-budget.tiers.test.mjs",
    "scripts/hooks/context-budget.handback.test.mjs",
    "scripts/hooks/context-budget.test.mjs",
    "scripts/hooks/context-budget.208.test.mjs",
    "scripts/hooks/context-budget.hardening.test.mjs",
    "scripts/hooks/context-budget.scratchpad.test.mjs"
  ],
  "decisions": [
    "The hook mechanics tests (162 main, 208, hardening, scratchpad) test at 70k/80k through a fixture CONTEXT_BUDGET_CONFIG, written into the test HOME. They test refusal/allow mechanics, not role numbers. The shipped role numbers are pinned in tiers, handback, budget and cell-state tests.",
    "BUILT_IN (70000/80000 in context-budget.mjs, the fail-open fallback for a missing, unparseable or invalid-default config) is unchanged. Existing tests pin it (context-budget.test.mjs 'missing file ...', tiers 'invalid or missing config ...'). The no-literal scan therefore covers the other four readers, and allows context-budget.mjs only its two BUILT_IN literals and no 100k/130k/150k.",
    "Statusline is the one reader with hard-coded numbers (CTX_LIMIT 80_000, CTX_YELLOW 70_000). It shows the orchestrator's budget, so the test makes it follow budgetFor('orchestrator') via CONTEXT_BUDGET_CONFIG.",
    "Developer may collapse cells into default or keep per-role entries: tests only require every cell key present to be 100k/150k and the default to be 100k/150k."
  ],
  "failures": [],
  "pending": [
    { "item": "Make the 25 failing tests pass: context-budget.json to default 100000/150000 (orchestrator stays 70000/80000); statusline reads budgetFor('orchestrator'); docs/agents/cell-start.md states cell 100k/150k and orchestrator 70k/80k (no '130k'); write the .claude/ edit (orchestrator.md 'Partial returns', organism-protocol 'Context budget') as a one-command patch in the dev handoff", "owner": "developer" }
  ]
}
```

## Criterion-to-test map

| Criterion | Test |
|---|---|
| Each cell role (developer, qa, designer, architect, security, scout, product, herald) and unknown role resolve to 100k/150k | `context-budget.test.mjs` "shipped config: every cell role ...", "... unknown role and no role ..."; hook: `context-budget.tiers.test.mjs` per-role loop + "no config entry" + "no longer stopped at 80k or 130k"; `context-cell-state.test.mjs` "every cell role reports ...", "unknown cell type", developer/security/null-reading tests; `context-budget-220.test.mjs` "shipped config gives ..." (JSON itself) |
| Orchestrator still 70k/80k; cell-start refuses at 80k | `context-budget.test.mjs` "the orchestrator stays at 70k / 80k"; `cell-start-context-gate.test.mjs` and `cell-start-context-config.test.mjs` (unchanged, green); `context-budget-220.test.mjs` statusline "default entry does not move the orchestrator's line" |
| Hook and cell-start tests that pin 80k/130k pin the new numbers | `context-budget.tiers.test.mjs`, `context-budget.handback.test.mjs` (stop at 150k, warn/silent bands at 100k/150k), `context-cell-state.test.mjs` updated; 162/208/hardening/scratchpad mechanics files moved to a fixture config (see decisions) |
| No reader holds a budget number | `context-budget-220.test.mjs`: statusline "limit shown is the config's orchestrator stop", "yellow from warn, red from stop"; "no reader's code holds a budget literal"; "context-budget.mjs holds only its fail-open built-in" |
| `docs/agents/cell-start.md` states new numbers | `context-budget-220.test.mjs` docs test (needs 100k, 150k, 80k; no 130k) |
| `.claude/` edit in developer handoff, user applied | human-verified |
| Config row in usage.jsonl after merge | human-verified (orchestrator action) |
| `npm test` and risk-check green | the suite; currently 4009 pass / 25 expected-red / 0 skipped |

## Notes for verify

- Light verify: diff test files against 98e5d11. The 25 red names are the 220 tests plus two handback tests in the "below warn"/"between warn and stop" group that moved to the 100k/150k bands.
- The old-number tests I edited changed numbers only (80k to 150k, 130k to 150k, 70k to 100k); no assertion was removed. The existing "invalid/missing config falls back to built-in 70k/80k" tests are untouched.
- The statusline test's no-literal scan strips `//` and block comments before matching, so comment prose like "ctx 64k/80k" is allowed.
