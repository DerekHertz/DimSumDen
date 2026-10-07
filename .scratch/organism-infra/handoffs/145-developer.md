```json
{
  "ticket": "organism-infra/145-cell-context-hook",
  "cell": "developer",
  "current_step": "PARTIAL (batch C, 145 + 165). Implementation is written and committed as a WIP commit on feat/batch-c-context-budget (parent b1c8093, the qa tests). I hit the old 80k hook (the live hook still has the hard-coded 80k) before I could run any test, so NOTHING is verified yet. A scout was started on a full npm test; its result never reached me.",
  "artifacts": [
    "scripts/context-budget.json (new: default 70k/80k, developer and qa 100k/120k, orchestrator 70k/80k)",
    "scripts/context-budget.mjs (new: budgetFor(role); CONTEXT_BUDGET_CONFIG override; invalid entry -> default; missing/unparseable/invalid-default file -> built-in 70k/80k; never throws)",
    "scripts/context.mjs (--cell <type> adds warn, stop, state; with or without --self)",
    "scripts/cell-start.mjs (WARN_AT/REFUSE_AT from budgetFor('orchestrator'))",
    "scripts/hooks/context-budget.mjs (thresholds and message limits from budgetFor(agent_type); 165: backslash outside single quotes is chain-unsafe; wrap-up writes only under the main checkout's .scratch/ (ORGANISM_ROOT, else first entry of git worktree list from cwd) or the scratchpad; session_id must match /^[\\w.-]+$/ and not be only dots, else no context read)",
    "docs/adr/0010-jev-precheck-tier-and-verify-depth.md (the 160 amendment, verbatim, as a sub-bullet after decision 3's last bullet, before decision 4)"
  ],
  "decisions": [
    "WARN_AT/STOP_AT exports removed from the hook; nothing else imported them (grep: only the hook and cell-start)",
    "warningText/refusalText now take (tokens, stop)",
    "ADR amendment placement: a bullet at the end of decision 3, separated from the previous bullet by a blank line (it sits right before decision 4); move it up one line if the blank line bothers the reviewer"
  ],
  "failures": [
    "No test has been run by me. Possible trouble spots to check first: the hardening tests (backslash cases, mainCheckout via git worktree list, ORGANISM_ROOT case) and the two edited 162 tests"
  ],
  "pending": [
    {
      "item": "Run npm test (delegate to scout). Fix any red among: scripts/context-budget.test.mjs, scripts/context-cell-state.test.mjs, scripts/cell-start-context-config.test.mjs, scripts/cell-start-context-gate.test.mjs, scripts/hooks/context-budget*.test.mjs, then the whole suite.",
      "owner": "developer"
    },
    {
      "item": "Write the gated patch .scratch/_handoffs/gated/145-context-budget.patch (make the edit on a scratch copy of .claude/skills/organism-protocol/SKILL.md, section 'Context budget (organism-infra/119)', git diff it with a/ b/ paths relative to the repo root): replace 'Aim to finish under 80k tokens' and the 70k/80k bullets with: thresholds live in scripts/context-budget.json (developer and qa 100k warn / 120k stop; security, architect, designer, scout and the orchestrator 70k/80k); run `node scripts/context.mjs --self --cell <your type>` at stage boundaries and follow `state`: ok = carry on; warn = finish the current stage, start no new exploration; stop = WIP commit, handoff, release --keep-status, outcome: partial. Keep the 'final context: <n>' line. Name the patch in the final handoff; the user applies it with !npm run apply-gated.",
      "owner": "developer"
    },
    {
      "item": "/code-review, final handoffs 145-developer.md and 165-developer.md (each ticket: criteria map), release both tickets with --status in-review. The 145 criterion 'thresholds re-evaluated from usage.jsonl' is done by the architect (handoffs/145-architect.md, user-approved); the thresholds are read from scripts/context-budget.json only.",
      "owner": "developer"
    }
  ]
}
```

## State
Partial. Branch `feat/batch-c-context-budget`, WIP commit on top of b1c8093. Code for 145 and 165 and the ADR amendment are written; unrun. The gated organism-protocol patch is not written. Same handoff text applies to 165 (the three hook hardening fixes are in scripts/hooks/context-budget.mjs).

Note for the orchestrator: the live hook still enforces a hard-coded 80k on developer cells (the config hook only takes effect once this batch merges), so a developer in this batch cannot run past 80k; the next developer cell will hit the same wall unless it keeps calls minimal. A fresh cell should start by running the test suite through scout.
