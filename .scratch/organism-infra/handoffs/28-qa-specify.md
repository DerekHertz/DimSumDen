```json
{
  "ticket": "organism-infra/28-review-claims-keep-in-review",
  "current_step": "qa specify done: failing tests committed",
  "artifacts": ["tests/organism-infra-28-review-claims @ c57f46e", "apps/organism-infra/board-review-claims.test.mjs"],
  "decisions": ["Pinned wire shape: claim by qa (--mode verify) or security on an in-review ticket keeps in-review while held; release --keep-status leaves in-review. No new flag."],
  "failures": [],
  "pending": [{"item": "Change claim in board-service.mjs (~line 722, replaceStatus(content, 'claimed')) to keep in-review for qa verify / security claims", "owner": "developer"}]
}
```

# 28 qa specify handoff

Branch: tests/organism-infra-28-review-claims (commit c57f46e)
Test file: apps/organism-infra/board-review-claims.test.mjs (node --test)

State: done. 3 tests: 2 red, 1 green.

## Criterion-to-test map
- Criterion 1 (qa-verify claim keeps in-review): test 1, RED (status is `claimed` while held).
- Criterion 1 (security claim keeps in-review): test 2, RED (same reason).
- Criterion 2 (tests cover both cells): tests 1 and 2.
- Guard: developer claim on ready-for-agent still sets `claimed` (green today).

## Notes for developer
- Claim sets status at board-service.mjs `claim`, `replaceStatus(content, "claimed")`. Release uses `--keep-status`, the way qa and security release.
- Tests assert in-review both during the claim and after release.
- Security is identified by cell type; qa only in verify mode (a qa specify claim on in-review is untested).

## jg vs grep
jg 1 call (located claim/release status logic and test files; useful, excerpts included claim). grep 1 call (line numbers for release/replaceStatus).
