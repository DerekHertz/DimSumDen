```json
{"ticket":"organism-infra/55-board-status-friction","cell":"qa","mode":"specify","current_step":"tests committed and pushed","artifacts":["apps/organism-infra/board-status-friction.test.mjs"],"decisions":["designer verdict pinned at the events log (cell, verdict) which snapshot reads; snapshot merge gate itself only reads security passes and is untouched","designer modes accepted: review, spec, critique, direction; no restriction of qa-only modes for designer pinned"],"failures":[],"pending":[{"item":"implement","owner":"developer"}]}
```

## Summary

Branch organism-infra/55-tests. One file: apps/organism-infra/board-status-friction.test.mjs. 8 of 11 fail (missing feature), 3 pass by design.

## Criterion to test map

- specify claim + --keep-status restores ready-for-agent: "returns a ready-for-agent ticket" (fails, stays claimed)
- scope: blocked ticket returns to blocked: "returns a blocked ticket to blocked" (fails)
- designer claim modes: four "accepts --mode X" tests (fail, invalid mode)
- designer review --verdict pass/bounce recorded in events with cell designer: two tests (fail)
- Guards that pass today: explicit --status blocked still works; designer verdict without lock rejected; retro add (same cell/mode republishes handoff after release) already passes, so a regression test only.

## Notes for developer

Prior status must persist from claim to release (e.g. in the lock or the claim event). Existing tests need claimed-after-keep-status unchanged for non-specify claims; restrict the restore to qa specify (or verify no other test breaks).
