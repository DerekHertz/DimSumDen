```json
{"ticket": "organism-infra/51-handoff-validates-at-publish", "cell": "qa", "mode": "specify", "current_step": "failing acceptance tests committed and pushed on organism-infra/51-tests (6e4bd79)",
 "artifacts": ["apps/organism-infra/board-handoff-validate.test.mjs", "scripts/cell-start.existing-branch.test.mjs", "scripts/log-cell-handoff.test.mjs", "scripts/usage-401.test.mjs", "scripts/cell-start.test.mjs (one test retargeted)"],
 "decisions": ["Existing cell-start test 'an existing branch name is refused' now uses --base <A> so the branch is ahead of base (still refused); the old form (branch at base) is now a success case", "usage 401 test stubs fetch via node --import preload, no network", "'holder's own earlier draft' = file in handoffs/ with mtime after the claim lock while the holder holds the claim; a file older than the claim from another cell/mode is still refused", "--allow-no-handoff reason test only requires the reason string appear as some value in the row (key name is the developer's choice)"],
 "failures": [],
 "pending": [{"item": "make tests pass; also update log-cell callers (log-cell-model, usage-rows, verdict-roles, verdict-lock-failures tests) with a handoff fixture or --allow-no-handoff", "owner": "developer"}]}
```

## Summary

Branch `organism-infra/51-tests`, head 6e4bd79, based on ca44ab6. 22 of the new tests fail for missing features; the rest are regression guards that pass today.

## Criterion to test map

- C1 invalid State refused, nothing written, stderr shows problems + example: board-handoff-validate.test.mjs "refuses a State block missing <field>" (x5), "refuses pending given as strings", "prints every problem", "a refused publish leaves an existing published handoff untouched".
- C2 valid publishes: "publishes a valid State block ..." (plus existing board-handoff.test.mjs).
- C3 cell-start existing branch: cell-start.existing-branch.test.mjs (at base, behind base = ff, diverged refused, ahead refused, new name still works).
- C4 log-cell handoff check: log-cell-handoff.test.mjs (match ok, no-mode match, missing, >24h, other cell, other mode, other ticket, --allow-no-handoff writes reason, empty reason refused).
- Scope (a): "fills cell and mode from the claim lock", "a filled-in handoff satisfies the release gate", "rejects a file with no JSON State block".
- Scope (b): "lock holder may overwrite its own earlier draft", plus two negative guards.
- Scope (c): usage-401.test.mjs (401 gives `claude /login` hint; 500 does not).

## Notes for the developer

- The example printed on failure must include fenced json and the quoted keys current_step, artifacts, decisions, failures, pending.
- Adding the log-cell handoff requirement will break scripts/log-cell-model.test.mjs, usage-rows.test.mjs, verdict-roles.test.mjs, verdict-lock-failures.test.mjs; update their setup (not assertions).
- Nothing is human-verified. The handoff skill example may need a doc edit under .claude/; propose to orchestrator, do not edit.
