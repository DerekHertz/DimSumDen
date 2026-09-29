```json
{"ticket":"organism-infra/45-release-gate-without-claim","cell":"qa","mode":"specify"}
```

## Summary

Branch: worktree-agent-a98cb85dd7b163dd2. Tests committed (specify sha on that branch HEAD).

## Criterion-to-test map

1. Release with no lock refused: apps/organism-infra/board-release-no-claim.test.mjs (2 tests: no handoff; handoff present). Pinned contract: refuse with non-zero exit and stderr matching /claim/i, no ticket change, no release event. This picks the "fail (claim first)" option of the ticket.
2. Secret patterns: scripts/risk-check.secrets.test.mjs (ghp_, sk-, xoxb/xoxa/xoxp-, plus a negative test for prose and lookalikes like "task-list"). Fixtures built at runtime by concatenation. The negative test passes today (guard against over-broad regexes; use a word boundary before sk-).
3. ADR 0008 decision 11 updated: human-verified (doc change).

## Red state

5 of 6 fail for missing features (the negative test passes by design). No setup errors.
