# Handoff: organism-infra/126 QA verify (batch D, with 177)

Branch `feat/batch-d-126-177`, commit `10ccc9a`.

```json
{
  "ticket": "organism-infra/126-relay-scripts-resolve-like-board",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify complete: all 2399 tests pass (no fails, no skipped). No tests were removed or loosened since specify. All 4 acceptance criteria are covered by passing tests.",
  "artifacts": [
    "apps/organism-infra/board-service.mjs",
    "apps/organism-infra/board-short-ref.test.mjs",
    "apps/organism-infra/board.mjs",
    "scripts/jev.mjs",
    "scripts/log-cell.mjs"
  ],
  "decisions": [],
  "failures": [],
  "pending": [
    {
      "item": "risk-check, then PR and merge",
      "owner": "orchestrator"
    }
  ]
}
```

## Verification summary

**Light verify:** all 2399 tests pass (2399 pass, 0 fail, 0 skipped). No tests were removed or loosened since specify.

## Test coverage: acceptance criteria to test mapping

Ticket 126: log-cell and jev resolve the board and refs like board does

1. **Criterion:** Run from a worktree with no `$ORGANISM_ROOT`, `log-cell.mjs` finds the handoff published in the main checkout and appends to the main checkout's `.scratch/usage.jsonl`.
   - **Test:** `scripts/log-cell-root.test.mjs` - "126 criterion 1: from a worktree with no $ORGANISM_ROOT, finds the main checkout's handoff and appends to its usage.jsonl"

2. **Criterion:** `jev.mjs route|tier|advisory-outcome --ticket <feature>/<NN>` resolves to the full slug ref, the same way `board` does. An ambiguous or missing NN still refuses.
   - **Tests:** `scripts/jev-ref-resolve.test.mjs` - 15 tests (3 tests × 5 jev commands):
     - "126 criterion 2: ${point} resolves a short ref to the full slug ref, run from a worktree" (tier, route, advisory-outcome)
     - "126 criterion 2: ${point} still takes a full slug ref"
     - "126 criterion 2: ${point} refuses a short ref with no matching ticket and logs nothing"
     - "126 criterion 2: ${point} refuses an ambiguous short ref and logs nothing"
     - "126 criterion 2: ${point} does not match a shorter NN against a longer one (12 is not 126)"

3. **Criterion:** Setting `$ORGANISM_ROOT` still overrides the root in both scripts.
   - **Tests:** 
     - `scripts/log-cell-root.test.mjs` - "126 criterion 3: $ORGANISM_ROOT overrides the git-derived root"
     - `scripts/jev-ref-resolve.test.mjs` - "126 criterion 3: ${point} lets $ORGANISM_ROOT override the git-derived root" (5 tests for tier, route, advisory-outcome)

4. **Criterion:** `npm test` is green.
   - **Verified:** 2399 pass, 0 fail

**Scope note (seq 1340):** Board CLI short refs have the developer's own tests in `apps/organism-infra/board-short-ref.test.mjs` (8 tests covering status, claim/comment/release, park, full slug, missing, ambiguous, unknown feature).

## Files modified

Files the diff touches (all within scope):
- `apps/organism-infra/board-service.mjs` - added `resolveShortRef(root, ref)` function
- `apps/organism-infra/board-short-ref.test.mjs` - new file, 8 developer tests for board CLI short refs
- `apps/organism-infra/board.mjs` - updated all commands to use `resolveShortRef`
- `scripts/jev.mjs` - updated to use `resolveRoot` and `resolveShortRef`
- `scripts/log-cell.mjs` - updated to use `resolveRoot` and `resolveShortRef`

## QA pass

All acceptance criteria are covered by passing tests. No tests were removed or loosened.
