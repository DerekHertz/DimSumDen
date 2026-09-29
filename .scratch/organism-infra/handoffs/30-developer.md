```json
{"ticket":"organism-infra/30-isolation-guard-handoff-writes","cell":"developer","current_step":"implemented on feature/organism-infra-30-board-handoff; 283/283 tests pass","artifacts":["apps/organism-infra/board.mjs","apps/organism-infra/board-service.mjs"],"decisions":["publishHandoff in board-service: name must match plain <name>.md (no separators, .., absolute); State block ticket must equal ref; feature dir must exist; atomicWrite into <main>/.scratch/<feature>/handoffs/","release --keep-status now enters the handoff gate; --force --reason bypasses and logs override"],"failures":[],"pending":[{"item":"organism-protocol and handoff skill edits (.claude): write handoff locally, publish with board handoff, drop shell-write exception","owner":"orchestrator"}]}
```

## Summary

Added `board handoff <ref> --from <file> [--name <n>]` and the `--keep-status` gate. qa's rejection tests, vacuous before, hold against the real command (all 283 tests pass).
