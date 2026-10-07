```json
{"ticket": "organism-infra/145-cell-context-hook", "cell": "qa", "mode": "specify",
 "current_step": "PARTIAL. Tests for 145 (config-driven thresholds) and 165 (hook hardening) are written and committed as a WIP commit on tests/batch-c-context-budget. NOT YET RUN: I hit the 80k context stop before running them, so red-for-the-right-reason is unverified.",
 "artifacts": ["scripts/context-budget.test.mjs", "scripts/hooks/context-budget.tiers.test.mjs", "scripts/context-cell-state.test.mjs", "scripts/cell-start-context-config.test.mjs", "scripts/hooks/context-budget.hardening.test.mjs", "scripts/hooks/context-budget.test.mjs (edited)", "scripts/hooks/context-budget.scratchpad.test.mjs (edited)"],
 "decisions": ["Seam for config: scripts/context-budget.mjs exports budgetFor(role) -> {warn, stop}; config file scripts/context-budget.json (shape in the architect handoff); env CONTEXT_BUDGET_CONFIG=<path> overrides the file (test seam, read in a child process so import-time or call-time both work)", "Fallbacks pinned: unknown role -> config default; invalid entry (non-numbers, warn>=stop, missing field) -> config default; missing/unparseable file or invalid default -> built-in 70000/80000; missing orchestrator key -> default", "context.mjs: new optional --cell <type> adds warn, stop, state (ok|warn|stop, null when the reading is null) with or without --self; no --cell leaves the output unchanged", "cell-start uses budgetFor('orchestrator'); the refusal message prints the configured limit ('orchestrator context 40k >= 40k: ...')", "Hook warning/refusal texts must name the role's own limit and not '80k' (developer/qa texts)", "Existing 162 tests EDITED by qa (not loosened): context-budget.test.mjs CELL agent_type qa->security and scratchpad test developer->security, because qa/developer now run at 100k/120k; the 162 .scratch wrap-up test now writes under the main checkout (ORGANISM_ROOT=<home>/main) because 165 refuses the worktree's own .scratch. All thresholds and assertions are unchanged. Verify must expect this diff.", "165 contract: main checkout = $ORGANISM_ROOT if set, else first entry of `git worktree list` from the call's cwd; backslash outside single quotes is chain-unsafe; session_id failing /^[\\w.-]+$/ -> no context read, allow", "Human-verified (no tests): 145 criterion re-evaluate thresholds from usage.jsonl (done by architect, approved by user); gated organism-protocol 'Context budget' patch (.scratch/_handoffs/gated/145-context-budget.patch, written by the developer); ADR 0010 amendment (docs only, text in 145 Comments, developer adds it verbatim); the dropped 145 criteria 1-3 and the settings.json registration (covered by 162)"],
 "failures": ["Context hit 80k before the first test run"],
 "pending": [{"item": "Run npm test (or node --test on the 5 new files plus the 2 edited 162 files). Confirm every new test fails because the feature is missing (no context-budget.mjs, no --cell flag, thresholds hard-coded, hardening absent), not from a fixture or import error; fix any fixture bugs. Check that the 162 files still pass where nothing new is required. Then write the final specify handoff and re-release.", "owner": "qa (fresh specify cell, same branch tests/batch-c-context-budget)"}]}
```

## State
Partial. Branch `tests/batch-c-context-budget`, WIP commit b1c8093 on base ec664af. Tests written, never executed.

## Criterion to test map (145 rescoped scope)
- Approved numbers (developer, qa 100k/120k; security, architect, designer, scout, orchestrator 70k/80k; default 70k/80k): `scripts/context-budget.test.mjs` "shipped config ..." tests.
- Config is the one value; fallbacks and validation: same file, "unknown role", "no orchestrator key", "invalid entry", "missing file", "unparseable file" tests.
- 162 hook reads it by agent_type: `scripts/hooks/context-budget.tiers.test.mjs` (tier boundaries 99,999/100k/119,999/120k, 70k/80k roles, fixture config, text names the role's limits, wrap-up still allowed, bad config fails safe).
- `context.mjs --cell`: `scripts/context-cell-state.test.mjs`.
- cell-start reads the orchestrator key: `scripts/cell-start-context-config.test.mjs` (the existing `cell-start-context-gate.test.mjs` pins shipped 70k/80k and must keep passing).
- Gated organism-protocol edit, thresholds re-evaluation, ADR 0010 amendment: human-verified.

## 165 map
- Backslash-hidden chain refused: `scripts/hooks/context-budget.hardening.test.mjs` "a backslash-escaped quote ...", plus "plain wrap-up commands are still allowed".
- `.scratch/` outside the main checkout refused, main and scratchpad allowed: "main checkout .scratch/ ...", "ORGANISM_ROOT ...", "a .scratch/ outside ...", "climbs out", "scratchpad" tests.
- Bad session_id fails open: "a session_id that fails ...".
- Existing 162 tests pass: see the edits under Decisions.

## For the developer
Create scripts/context-budget.json, scripts/context-budget.mjs, and wire the hook, cell-start and context.mjs; implement the three 165 fixes; write the gated patch for organism-protocol "Context budget" (numbers plus "follow `state` from `context.mjs --self --cell <type>`"); add the ADR 0010 amendment verbatim.
