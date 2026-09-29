```json
{"ticket":"organism-infra/45-release-gate-without-claim","cell":"developer","mode":"implement","current_step":"done, in-review","artifacts":["apps/organism-infra/board-service.mjs","scripts/risk-check.mjs","docs/adr/0008-board-service.md","apps/organism-infra/board-status-and-lock.test.mjs"],"decisions":["gated release (in-review, resolved, --keep-status) with no claim lock is refused unless --force","old tests in board-status-and-lock.test.mjs got a claim lock; test 138 tolerates exit 1 for a refused release"],"failures":[],"pending":[]}
```

# Handoff: organism-infra/45, developer

Gated release with no claim lock is refused. SECRET_PATTERNS gained ghp_, sk- (word-boundary) and xox[abp]-. ADR 0008 decision 11 updated. Full suite: 308 pass, 0 fail.
