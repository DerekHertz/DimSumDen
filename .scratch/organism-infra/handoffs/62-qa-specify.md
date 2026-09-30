```json
{"ticket":"organism-infra/62-handoff-name-matches-ticket","cell":"qa","mode":"specify","current_step":"failing tests committed and pushed","artifacts":["apps/organism-infra/board-handoff-name-prefix.test.mjs","branch organism-infra/62-tests @ a045e24"],"decisions":["Tests use the existing board-fixture and runBoard CLI seam; no new runner.","Cross-claim case: a same-cell handoff older than the current lock must be refused (today it is allowed because cell/mode match)."],"failures":[],"pending":[{"item":"make tests pass in publishHandoff (apps/organism-infra/board-service.mjs)","owner":"developer"}]}
```

## Summary

Branch `organism-infra/62-tests` (a045e24), base cec01ba. One new file: `apps/organism-infra/board-handoff-name-prefix.test.mjs`.

Criterion to test map:
- Different NN- prefix refused, target untouched: "a --name with another ticket's NN- prefix is refused and that file is untouched" (red: exit 0).
- Error names expected prefix `08-`: "the prefix error names the expected prefix" (red: exit 0).
- Another claim's handoff not overwritten, own draft still works: "refuses to overwrite a handoff from an earlier claim, allows own draft under the current claim" (red: overwrite allowed).
- Guard test (already green, must stay green): "a --name with the matching prefix is still accepted".

Result: 3 fail for the right reason, 1 passes. No criteria are human-verified.

Note for developer: the existing test in board-handoff.fix1.test.mjs ("refuses to overwrite another cell's handoff") uses no claim lock, so the new cross-claim rule should apply only when a lock exists and the file predates it.
