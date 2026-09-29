```json
{"ticket": "dimsumden-ui-v0/08", "cell": "qa", "mode": "specify", "current_step": "Table tests for sceneFromState committed and failing on the missing module.",
 "artifacts": ["apps/ui/src/scene/scene-from-state.test.mjs"],
 "decisions": ["Dynamic import per test so each fails individually until scene-from-state.mjs exists", "Browser smoke criterion marked human-verified here; ticket 13 owns the automated smoke"],
 "failures": [],
 "pending": [{"item": "Create apps/ui/src/scene/scene-from-state.mjs exporting sceneFromState and MAX_PLUSH=12, plus the renderer", "owner": "developer"}]}
```

## State
Partial by design: tests red (ERR_MODULE_NOT_FOUND, missing feature), 35 tests, all failing.

## What changed
Branch `tests/dimsumden-ui-v0-08-scene-from-state`, commit 13a9eb0 (base b1a1a69). Only the test file above.

## Criterion to test map
- AC1 "Table test over snapshots": all tests in scene-from-state.test.mjs. Covers ADR 0011 decision 7: active set (each status, resolved excluded, blocked-not-in-frontier excluded), cellType table, pose rule-order table (checked against director STATES), perch region and per-region slot, output order (active by ref, then frontier order), MAX_PLUSH cap with active winning, purity, ADR worked example.
- AC2 "Browser smoke: one plush per active fixture ticket; resolved absent": human-verified (designer review after qa; automated smoke lands with ticket 13). No node test.

## Decisions made
- The ADR JSON sketch shows cellType developer for the dispatch-gate example whose lastCell is orchestrator; the rule text (holder, else lastCell) governs, so the worked-example test expects orchestrator, crown#0.
- Ties/edge choices pinned: pose rule order starts with gate; output keys are exactly ref, cellType, status, perch, pose.

## Next step
developer: implement scene-from-state.mjs (no three/React/DOM imports) and the renderer per designer spec section 2 (07-designer-spec.md).

## Gotchas
Not tested (spec leaves open): spill past anchor count to grass (renderer's job), chips, camera.
