```json
{"ticket": "organism-infra/58", "cell": "qa", "mode": "specify", "current_step": "failing tests committed and pushed on organism-infra/58-tests",
 "artifacts": ["scripts/jev-floor.test.mjs"], "decisions": ["decide gets qaSpecified (default true); false on verify floors to full", "floor logged as floor: \"full\" on row and result, null otherwise (also logged when Jev already picked full, and on fallback paths)", "CLI derives qaSpecified from <root>/.scratch/<feature>/handoffs/<NN>-qa-specify*.md, NN = leading number of the slug"],
 "failures": [],
 "pending": [{"item": "implement the floor in scripts/jev.mjs so the 10 new tests pass", "owner": "developer"}]}
```

## State
Done: 10 new tests, all failing for the missing feature (floor undefined or light not floored); the 13 existing jev tests still pass.

## What changed
Branch organism-infra/58-tests. New file scripts/jev-floor.test.mjs (the contract is in its header comment).

## Criterion to test map
- No specify handoff, effective full in shadow and live: decide tests 1-4 (live, shadow, full pick, fallback), CLI test "no qa-specify handoff" (both modes).
- With specify handoff, behaviour unchanged: "with qa-specify: live verify behaves as before", "omitting qaSpecified", CLI "07-qa-specify handoff" (also 07-qa-specify2.md).
- Row records the floor: row.floor asserted in all of the above; tier stays null.

## Next step
Developer implements in scripts/jev.mjs (decide plus CLI handoff lookup).

## Gotchas
Live mode over the CLI cannot reach the network in tests; the live floor is covered through decide with a fake transport.
