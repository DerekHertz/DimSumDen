# 220 developer

Branch `tests/organism-infra-220-context-budget` (commit 80cc329 on top of qa's 98e5d11). `npm test`: 4034 pass, 0 fail.

```json
{
  "ticket": "organism-infra/220-one-context-budget-for-cells",
  "cell": "developer",
  "current_step": "Implemented and committed. 25 red tests now green; full suite 4034/4034. Gated .claude/ patch written and waiting for the user to apply.",
  "artifacts": [
    "scripts/context-budget.json",
    "scripts/context-budget.mjs",
    "scripts/statusline.mjs",
    "docs/agents/cell-start.md",
    "scripts/context-budget.test.mjs",
    "scripts/hooks/context-budget.tiers.test.mjs",
    "scripts/context-budget-220.test.mjs",
    ".scratch/_handoffs/gated/220-context-budget-docs.patch"
  ],
  "decisions": [
    "Config collapsed: context-budget.json is now default 100000/150000 plus orchestrator 70000/80000; the per-role cells block is gone (unknown role and every cell role resolve through default).",
    "Built-in fallback (missing, unparseable or invalid-default config) is per role: cell roles and unknown/undefined 100000/150000, orchestrator 70000/80000. BUILT_IN is now {cell, orchestrator}; nothing else imported it. So the orchestrator's limits hold under a broken config; no flag needed.",
    "statusline.mjs drops CTX_LIMIT/CTX_YELLOW and takes {warn, stop} from budgetFor('orchestrator'). hook, cell-start and context.mjs already held no literals.",
    "docs/agents/cell-start.md: added a paragraph with the cell 100k/150k numbers; the orchestrator 70k/80k text is unchanged."
  ],
  "failures": [],
  "pending": [
    { "item": "User applies the gated patch with `!npm run apply-gated` (edits organism-protocol SKILL.md 'Context budget' and orchestrator.md 'Partial returns'; git apply --check passed on this branch) before qa verify", "owner": "user" },
    { "item": "Light verify against the changed assertions listed below; note risk-check hits are in qa's own test files (child_process in context-budget-220.test.mjs; board/lock words in hooks/context-budget.handback.test.mjs), not in product code", "owner": "qa" },
    { "item": "After merge, append the kind:config row to .scratch/usage.jsonl with old (cells 100k/130k for developer/qa/designer, 70k/80k others) and new (100k/150k all cells) budgets", "owner": "orchestrator" }
  ]
}
```

## Test assertions I changed (per the user decision on the built-in fallback)

- `scripts/context-budget.test.mjs`: header comment; "missing file ..." now expects cell roles (developer, qa, scout, some-future-cell, undefined) at 100k/150k and the orchestrator at 70k/80k; "unparseable file, or an invalid default entry ..." now expects developer 100k/150k and adds the orchestrator staying 70k/80k for both cases.
- `scripts/hooks/context-budget.tiers.test.mjs`: "an invalid or missing config file ..." moved from 60k/75k/85k to 90k silent, 120k warns, 155k refuses (bad config), and 90k silent, 155k refuses (missing config).
- `scripts/context-budget-220.test.mjs`: "context-budget.mjs holds only its fail-open built-in" replaced the `<=2 hits` and no-100k/130k/150k rule with an exact check that the code literals are 70000, 80000, 100000, 150000 (no 130k).

No assertion removed; the 25 originally red tests untouched.

## Gated patch

`.scratch/_handoffs/gated/220-context-budget-docs.patch`. User runs `!npm run apply-gated`. Changes: SKILL.md "Context budget" now says every cell role warns 100k and stops 150k, the orchestrator 70k/80k; orchestrator.md "Partial returns" now says "150k for every cell role".
