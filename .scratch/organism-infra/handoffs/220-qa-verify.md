# 220 qa verify (light)

Verdict: QA pass. Branch `tests/organism-infra-220-context-budget`, tip 63ea546 (detached worktree). Specify sha 98e5d11.

```json
{
  "ticket": "organism-infra/220-one-context-budget-for-cells",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify passed: suite green (4034/0 fail/0 skipped, /tmp/220-tests.txt, second run on 63ea546); test diff vs 98e5d11 shows only the user-approved assertion changes; every criterion mapped.",
  "artifacts": [
    ".scratch/organism-infra/handoffs/220-qa-verify.md"
  ],
  "decisions": [
    "Suite result taken from /tmp/220-tests.txt as instructed, not re-run: tests 4034, pass 4034, fail 0, skipped 0, no 'not ok' lines.",
    "The three changed assertions follow the orchestrator-recorded user decision on the built-in fallback (ticket Comments, 2026-10-11). None removed or loosened: old-number checks moved to 100k/150k and the orchestrator 70k/80k is now asserted under missing and invalid config as well. The 220 scan changed from '<=2 hits, no 100/130/150k' to an exact set 70000, 80000, 100000, 150000 (sorted deepEqual), which still excludes 130k.",
    "Run 1 failed once in apps/ci-cd/dev-server.test.mjs ('dev server exited before it answered'); it passed alone and in run 2, and this branch touches nothing under apps/. Treated as a known flake, not a finding."
  ],
  "failures": [],
  "pending": [
    { "item": "Run npm run risk-check. Developer expects hits only in qa's own test files (child_process in context-budget-220.test.mjs; board/lock words in hooks/context-budget.handback.test.mjs), not product code", "owner": "orchestrator" },
    { "item": "After merge, append the kind:config row to .scratch/usage.jsonl (old: developer/qa/designer 100k/130k, others 70k/80k; new: all cells 100k/150k, orchestrator 70k/80k)", "owner": "orchestrator" }
  ]
}
```

## Test-file diff vs specify (98e5d11)

Only three files differ: `scripts/context-budget-220.test.mjs`, `scripts/context-budget.test.mjs`, `scripts/hooks/context-budget.tiers.test.mjs`. The other six qa files are byte-identical. Changes match the developer handoff list exactly.

## Criterion map

| Criterion | Test |
|---|---|
| Cell roles and unknown role 100k/150k | `context-budget.test.mjs` shipped-config tests; `context-budget.tiers.test.mjs`; `context-cell-state.test.mjs`; `context-budget-220.test.mjs` "shipped config gives ..." |
| Orchestrator 70k/80k, cell-start refuses at 80k | `context-budget.test.mjs` orchestrator test; `cell-start-context-gate.test.mjs`; `cell-start-context-config.test.mjs`; 220 statusline test |
| Hook/cell-start tests pin new numbers | tiers, handback, cell-state tests |
| No reader holds a budget number | `context-budget-220.test.mjs` no-literal scan and statusline tests |
| cell-start.md states new numbers | `context-budget-220.test.mjs` docs test |
| `.claude/` edit in dev handoff, user applied | human-verified; confirmed: patch applied as 63ea546 (orchestrator.md and organism-protocol SKILL.md diffs present) |
| Config row in usage.jsonl after merge | human-verified (orchestrator action, post-merge) |
| npm test and risk-check | suite green; risk-check is the orchestrator's next step |

Comment-scope items: the user decision on the built-in fallback maps to `context-budget.test.mjs` "missing file ..." and "unparseable file ...", `context-budget.tiers.test.mjs` "an invalid or missing config file ...", and the 220 built-in scan. The orchestrator-stays-70k/80k-under-broken-config reading is asserted in both budget tests.

## Files touched outside ticket scope

None beyond the ticket. Changed since specify: `scripts/context-budget.json`, `scripts/context-budget.mjs`, `scripts/statusline.mjs`, `docs/agents/cell-start.md`, `.claude/agents/orchestrator.md`, `.claude/skills/organism-protocol/SKILL.md` (the gated patch the ticket requires), plus the three test files.

One observation for security/orchestrator, not a finding: `statusline.mjs` now reads the budget once at import (module-level), so a config edit needs a statusline process restart; the statusline is a per-invocation process, so this has no practical effect.
