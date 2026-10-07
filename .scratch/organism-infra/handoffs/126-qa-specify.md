```json
{
  "ticket": "organism-infra/126-relay-scripts-resolve-like-board",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Batch D specify done: failing tests committed on tests/batch-d-126-177 at 871c64c. 8 tests for 126 fail for the right reason; guards pass.",
  "artifacts": [
    "branch tests/batch-d-126-177 @ 871c64c",
    "scripts/log-cell-root.test.mjs",
    "scripts/jev-ref-resolve.test.mjs"
  ],
  "decisions": [
    "Tests run the real CLIs for real from a linked worktree of a throwaway repo (makeBoardFixture), with ORGANISM_ROOT unset unless the test is about the override.",
    "Short ref rule pinned: <feature>/<NN> resolves to the one issue file whose name starts with <NN>- (whole numeric segment: 12 does not match 126). Zero or two or more matches refuse (non-zero exit, stderr text, no usage row).",
    "The ticket says board already accepts short refs. It does not: `board status organism-infra/126` fails with 'invalid ticket segment: 126'. Only resolveRoot is exported from board-service.mjs and reusable. The developer must add the ref resolver once (board-service.mjs, exported) and use it from log-cell and jev, not copy it. The tests pin the CLI behavior only; they do not say where the code lives."
  ],
  "failures": [
    "apps/ui/den-scene-mounted.test.mjs 'PR #162 ... under 90 s' fails on a clean checkout: it expects TAP output (# fail 0) but the local node prints the spec reporter. Pre-existing and unrelated, not caused by these tests."
  ],
  "pending": [
    {
      "item": "Implement 126 and 177 so the 10 red tests go green; npm test otherwise green apart from the den-scene-mounted reporter failure.",
      "owner": "developer"
    }
  ]
}
```

## Summary

Criterion to test map for 126 (ticket scope added in comments: none):

- C1 (worktree, no ORGANISM_ROOT, log-cell finds main's handoff and appends to main's usage.jsonl): `log-cell-root.test.mjs` "126 criterion 1: from a worktree ... appends to its usage.jsonl" (red). Guard "... no handoff anywhere ... still refused" (passes today).
- C2 (jev route|tier|advisory-outcome short ref resolves to full slug; ambiguous or missing NN refuses): `jev-ref-resolve.test.mjs`, one set per point:
  - "resolves a short ref to the full slug ref, run from a worktree" (red x3; checks the usage row and the stdout ticket are the full ref)
  - "still takes a full slug ref" (guard)
  - "refuses a short ref with no matching ticket and logs nothing" (red for advisory-outcome, which does not check the ticket today; guard for tier and route)
  - "refuses an ambiguous short ref and logs nothing" (same split)
  - "does not match a shorter NN against a longer one (12 is not 126)" (same split)
- C3 (ORGANISM_ROOT still overrides, both scripts): `log-cell-root.test.mjs` "$ORGANISM_ROOT overrides the git-derived root"; `jev-ref-resolve.test.mjs` "lets $ORGANISM_ROOT override the git-derived root" x3. All guards, pass today; they stop the developer breaking the override.
- C4 (npm test green): not a test; verify runs `npm test`.

Beyond the ACs, from the ticket's "What to build" (they "take the same refs"): `log-cell-root.test.mjs` "126 body: a short ref resolves to the full slug in the row" (red) and "... naming no ticket is refused" (guard). The row's ticket must be the full ref. Drop these two if the orchestrator reads that sentence as jev-only.

Note: advisory-outcome currently logs rows for tickets that do not exist. Only a short ref (no full slug) is checked in my tests, so a full slug for a missing ticket keeps today's behavior.

Fails today for the right reason: jev says "ticket not found: sample/126 (no issue file at .scratch/sample/issues/126.md)"; log-cell says "no handoff ... from qa" or "ticket not found: sample/01" when run from a worktree. No import or setup errors.
