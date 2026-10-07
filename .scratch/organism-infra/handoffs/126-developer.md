# Handoff: organism-infra/126 developer (batch D, with 177)

Branch `feat/batch-d-126-177`, commit `10ccc9a` (a previous session pushed it without claiming or handing off; this session checked it against both tickets and the user's scope note, found nothing missing, and added no code).

## What was built

- `resolveShortRef(root, ref)` in `apps/organism-infra/board-service.mjs`: the one resolver. `<feature>/<NN>` (whole numeric segment) resolves to the one issue file named `<NN>-*`; a full ref passes through; zero matches ("not found") or several ("ambiguous", names the matches) refuse.
- `apps/organism-infra/board.mjs` uses it on claim, reclaim, release, resolve, park/unpark/reopen, handoff, status, comment.
- `scripts/log-cell.mjs` and `scripts/jev.mjs` use board's `resolveRoot` (so a worktree run finds the main checkout; `$ORGANISM_ROOT` still wins) and `resolveShortRef`. jev's own copy of the root finder was removed.
- User's scope note (seq 1340): board CLI short refs have the developer's own tests in `apps/organism-infra/board-short-ref.test.mjs` (8 tests: status, claim/comment/release, park, full slug, missing, 12 is not 126, ambiguous, unknown feature). qa's tests cover log-cell and jev.

## Checks run

- qa's tests (log-cell-root, log-cell-scout, jev-ref-resolve) plus board-short-ref and log-cell-handoff: 53/53 pass.
- `npm test` (via scout): 2399 pass, 0 fail. `node --check` clean on the four changed scripts.

```json
{
  "ticket": "organism-infra/126-relay-scripts-resolve-like-board",
  "cell": "developer",
  "current_step": "Implementation verified complete on 10ccc9a; all 126 acceptance criteria and the board short-ref scope item are covered by passing tests; npm test green (2399/2399).",
  "artifacts": [
    "apps/organism-infra/board-service.mjs",
    "apps/organism-infra/board.mjs",
    "apps/organism-infra/board-short-ref.test.mjs",
    "scripts/jev.mjs",
    "scripts/log-cell.mjs"
  ],
  "decisions": [
    "One resolver (resolveShortRef) lives in board-service.mjs; log-cell and jev import it and resolveRoot rather than keep copies.",
    "log-cell and jev fall back to the cwd when no root resolves (not in a git checkout and no $ORGANISM_ROOT), keeping the old default."
  ],
  "failures": [],
  "pending": [
    {
      "item": "qa verify (batch D: 126 and 177), then risk-check, then PR and merge",
      "owner": "qa"
    }
  ]
}
```
