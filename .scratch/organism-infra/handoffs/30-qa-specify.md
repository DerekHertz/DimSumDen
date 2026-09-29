```json
{"ticket":"organism-infra/30-isolation-guard-handoff-writes","cell":"qa","mode":"specify","current_step":"failing tests committed on tests/organism-infra-30-board-handoff at 633dacb (5 red)","artifacts":["apps/organism-infra/board-handoff.test.mjs","apps/organism-infra/board-claim-ergonomics.test.mjs","apps/organism-infra/board-review-claims.test.mjs"],"decisions":["CLI pinned: board handoff <ref> --from <file> [--name <name>]; name defaults to basename of --from; ORGANISM_ROOT blanked in tests","--name with separators, .., or absolute is rejected and writes nothing; State block ticket must equal ref (other feature rejected); missing feature rejected","release --keep-status runs the same handoff gate; --force --reason bypasses","Edited two existing keep-status tests (claim-ergonomics, review-claims) to write a valid handoff first, since the gate now applies"],"failures":[],"pending":[{"item":"implement board handoff and keep-status gate","owner":"developer"},{"item":"organism-protocol and handoff skill edits (.claude)","owner":"orchestrator"}]}
```

## Summary

Branch tests/organism-infra-30-board-handoff, commit 633dacb, base 565f4a1. 5 tests fail (unknown command: handoff, and keep-status gate absent). Rejection tests pass vacuously until the command exists; they assert exit != 0 and an empty handoffs dir. Criterion 4 human-verified.
