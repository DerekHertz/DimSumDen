```json
{"ticket": "organism-infra/51-handoff-validates-at-publish", "cell": "qa", "mode": "verify", "current_step": "full verify done on organism-infra/51-wip @ 2093a79: QA pass",
 "artifacts": ["handoffs/51-qa-verify.md"],
 "decisions": ["Test :145 retarget to a developer claim is a correct fix, not a weakening", "Other test-file edits only add --allow-no-handoff setup args; no assertions removed"],
 "failures": [],
 "pending": []}
```

## Summary

QA pass. `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npm test`: 863 pass, 1 fail (smoke:ui "load", Google Fonts cert, environmental), 0 skipped.

## Criterion to test map

- Invalid State refused, nothing written, stderr shows problems and example: board-handoff-validate.test.mjs:54, :70, :83, :98, :159
- Valid block publishes: :114, :128, :145
- cell-start existing branch: scripts/cell-start.existing-branch.test.mjs:68-109, cell-start.test.mjs:160
- log-cell handoff check and --allow-no-handoff: scripts/log-cell-handoff.test.mjs:51-126
- Scope (a) fill from lock, no-JSON rejected: :128, :159. (b) overwrite own draft: :175-213. (c) usage 401: scripts/usage-401.test.mjs:28, :35

## Test diff vs specify 6e4bd79

- board-handoff-validate.test.mjs:145 now claims as developer (a specify claim cannot release at in-review, by design). Fix, not a weakening.
- log-cell-model, usage-rows, verdict-lock-failures, verdict-roles tests gained `--allow-no-handoff "test setup"` only.

Files outside scope: none beyond the four test files above.
