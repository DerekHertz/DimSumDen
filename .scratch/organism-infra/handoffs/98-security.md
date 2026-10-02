```json
{
  "ticket": "organism-infra/98-board-resolve-command",
  "cell": "security",
  "current_step": "Security pass on 62e440a with one medium and two low findings; none block. Reviewed by hand against origin/main (4 files, +365). gitleaks clean (2 commits). No dependency, lockfile or CI changes.",
  "artifacts": [
    "branch feat/98-board-resolve @ 62e440a",
    "apps/organism-infra/board-service.mjs:1315-1323 (forced undo)"
  ],
  "decisions": [
    "Rated the undo-path lock deletion medium, not high: the window is between resolve's validation and its claim, the only caller is the orchestrator after a merge, and the board is a single-user local tool. Reproduced it anyway, so the developer should fix it in a follow-up."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Follow-up ticket: in resolve's catch block, only undo when the lock holder is orchestrator (read the lock with claimingCell before the forced release); add a test for the mid-batch failure path.",
      "owner": "developer"
    }
  ]
}
```

## Summary

Verdict: Security pass.

Scope: `board resolve` in `board-service.mjs`, its CLI wiring in `board.mjs`, the tests, and one docs line. Shell exposure: none (no exec calls added). Network: none.

Checked and fine:
- Ref handling goes through `prepare` and `parseTicketRef` (feature and ticket regexes, `assertWithinRoot`), so no path traversal. The handoff name is built from the validated `NN-` prefix and goes through `publishHandoff`'s name regex, symlink and overwrite checks.
- `--pr` is validated by `validatePrFlag` (positive integer). `--note` has a length check and `sanitizeCommentText`, so it cannot forge a comment line. It follows the State block, so the first-json-block parse is unaffected.
- The draft dir is `mkdtemp` (0700) under the OS tmpdir and removed in `finally`.
- Phase 1 validates every ref before any write. A lock held by another cell refuses the whole batch.
- `resolve` adds no new privilege: cell identity was already self-declared, and `claim <ref> orchestrator` plus `release --status resolved` reach the same state.

## Findings

1. MEDIUM, `apps/organism-infra/board-service.mjs:1315-1323`: the undo-on-failure path does not check who holds the lock. If another cell claims a later ref after phase 1 and before `resolve` reaches it, `claim` fails with "already claimed". The catch block then sees a lock that is not resolved and calls `release(..., { force: true })`. That deletes the other cell's lock, resets the ticket status to its earlier value, and writes a comment attributed to that cell ("resolve failed; claim undone"). Reproduced in a temp board: a developer claim on the last ticket of a 6-ticket batch was silently erased. Fix: read the lock and undo only if `claimingCell(...) === "orchestrator"`. The force release stays, since it is the only way to free a lock the handoff gate would block.
2. LOW, `board-service.mjs:1313-1323`: the undo path has no test (the developer said so). Add one for a mid-batch failure and for the foreign-lock case above.
3. LOW, `board-service.mjs:1313, 1315-1327`: if `release` writes `resolved` but the usage row fails, the ref is not in `done` and the report says "resolved: none" for it. The inner error text does say the ticket is resolved, so the operator is not misled for long.

Informational: `resolve` accepts any starting status (including `ready-for-agent` or `blocked`), not just `in-review`. The ticket does not ask for a status check, so I did not raise it.

## Scans

- gitleaks detect on origin/main..62e440a: no leaks.
- npm audit (cell-start npm ci): 0 vulnerabilities. No new dependencies.
