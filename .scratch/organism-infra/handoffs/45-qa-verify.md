```json
{"ticket":"organism-infra/45-release-gate-without-claim","cell":"qa","mode":"verify","current_step":"verdict written: QA pass","artifacts":["apps/organism-infra/board-release-no-claim.test.mjs","scripts/risk-check.secrets.test.mjs","apps/organism-infra/board-status-and-lock.test.mjs"],"decisions":["QA pass: 308/308 tests, specify tests unchanged since bd27ee8, no token literals in diff","edits to board-status-and-lock.test.mjs are faithful adaptations"],"failures":[],"pending":[{"item":"security review","owner":"security"}]}
```

# Handoff: organism-infra/45, qa verify

Verdict: QA pass. Branch worktree-agent-acdec6683aa8d2d4a at 51a0f21.

- Full suite: 308 pass, 0 fail, 0 skipped.
- Specify tests (board-release-no-claim.test.mjs, risk-check.secrets.test.mjs): zero diff since bd27ee8.
- Criterion 1: board-release-no-claim.test.mjs (2 tests). Criterion 2: risk-check.secrets.test.mjs. Criterion 3: ADR 0008 decision 11 updated (checked by reading the diff).
- Edits to board-status-and-lock.test.mjs: four tests gained a claim lock (needed under the new rule, assertions unchanged); the comment test uses `--as developer` because with a lock held `--as` must match the lock's cell; the concurrent-one-ticket test now allows exit 1 for a release only, and its per-op occurrence assertion (written once on success, zero times on failure) is intact. The multi-ticket concurrent test locks only the release tickets. Faithful, not weakening. Minor note: exit 1 for release is tolerated without checking the stderr says "claim".
- Token literals: none. Only regexes and prefix words in prose.
- Out-of-scope files: none. (Renamed the password pattern's display name "password= style" to "password=style"; cosmetic.)
