```json
{"ticket": "organism-infra/35-release-event-records-force", "cell": "qa", "mode": "specify",
 "current_step": "failing tests committed on tests/organism-infra-35-release-gate at 143617b (6 red, 2 green)",
 "artifacts": ["apps/organism-infra/board-release-gate.test.mjs"],
 "decisions": ["State block gains `cell` and (for moded cells) `mode` fields; gate matches them to the claim", "handoff must have mtime >= claim lock mtime", "release event gets boolean force on every op:release event"],
 "failures": [],
 "pending": [{"item": "implement force field, cell/mode/age gate; update handoff skill State-block doc and existing fixtures (writeValidHandoff) to include cell; explain the 34 case in a ticket comment", "owner": "developer"}]}
```

## Summary

Branch `tests/organism-infra-35-release-gate`, commit 143617b, based on 60d7957.

Criterion map (all in board-release-gate.test.mjs):
- 1 force recorded: 3 tests (normal, --force, ungated). Red.
- 2 no handoff fails: 1 test. Already green (gate existed); regression guard.
- 3 cell/mode/age binding: qa-specify handoff vs developer release (red), specify vs verify mode (red), matching cell+mode passes (green control), handoff older than claim (red).
- 4 explain 34 case: human-verified (ticket comment).

Developer notes: existing tests using writeValidHandoff/stateBlock lack `cell`; once the gate requires it they will need `cell` (and `mode`) added. That is a fixture update, not weakening; do not loosen the new tests. The claim time is the claim lock's mtime.
