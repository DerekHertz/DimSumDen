```json
{"ticket":"organism-infra/55-board-status-friction","cell":"developer","current_step":"implemented, full npm test green (889/889), committed on organism-infra/55-impl","artifacts":["apps/organism-infra/board-service.mjs","apps/organism-infra/board-claim-ergonomics.test.mjs"],"decisions":["qa specify claim on a ready-for-agent or blocked ticket appends the prior status as a 4th lock token; release --keep-status of that claim restores it","designer accepts claim modes review|spec|critique|direction; designer --verdict accepted only from a review-mode claim","edited one old test (board-claim-ergonomics keep-status byte-identical) to use a developer claim, since its qa specify premise is superseded by this ticket; qa's new tests untouched"],"failures":[],"pending":[{"item":"verify","owner":"qa"}]}
```

## Summary

Changes in board-service.mjs: DESIGNER_MODES + modeAllowed in claim; prior-status token in the qa specify lock and restore in release; designer added to VERDICT_CELLS with a review-mode requirement. reclaim still only accepts qa/security modes (designer modes not added there).
