## State
```json
{"ticket": "organism-infra/17", "current_step": "qa specify complete: failing tests committed and pushed",
 "artifacts": ["apps/organism-infra/schemas.test.mjs"],
 "decisions": [
   "pending items are objects {item, owner}; owner is checked only for a non-empty string, never matched against a hardcoded relay-name list, per the ticket's instruction",
   "did not create a schemas.mjs stub; tests fail on ERR_MODULE_NOT_FOUND since the module itself is the whole feature (qa never writes product code)"
 ],
 "failures": [],
 "pending": [{"item": "implement apps/organism-infra/schemas.mjs to turn all schemas.test.mjs cases green", "owner": "developer"}]}
```

**State**: done (specify). Branch `claude/organism-infra-17-tests` pushed, commit `110dd933adcf72bfd9bb0cb22f0410a36f37b822`.

**What changed**: Added `apps/organism-infra/schemas.test.mjs` only, no product code. `node --test apps/organism-infra/schemas.test.mjs` fails with `ERR_MODULE_NOT_FOUND` for `./schemas.mjs` -- the right reason, since that module is ticket 17's entire deliverable.

**Criterion -> test map**
- "each validator rejects a missing required key with a named error" -> one parametrized test per top-level key for Contract (5), State (6), Receipt (11), plus Receipt's nested `tests.passed`/`tests.failed`/`worktree.path`/`worktree.clean` (4). All assert `result.errors` contains a string naming the missing field.
- "`validateState` pending array valid only when a named next cell is followed, without hardcoding relay names" -> 4 tests: accepts pending items shaped `{item, owner}` including a made-up owner (`"some-future-cell"`, to prove no hardcoded enum); rejects a bare string, an empty-string owner, and a missing `owner` field.
- "`validateReceipt` accepts `tool_refusals: []` as valid" -> 2 tests: empty array passes and isn't reported as missing; non-empty array with `{tool, what}` shape also passes.
- "one valid and one invalid case per validator" -> satisfied by the full-valid-object test per validator plus the missing-key loops above.
- No-throw contract (`What to build`: "no throwing... `{ok:true}` or `{ok:false, errors}`") -> 15 tests (3 validators x 5 garbage inputs: null, undefined, string, number, `{}`), each wrapped in `assert.doesNotThrow`.

All 42 tests in the file currently fail the same way (module not found), which is correct for a from-scratch module.

**Decisions made**: The ticket left the `pending` item shape undefined beyond "a named next cell." I chose `{item: string, owner: string}` with only a non-empty-string check on `owner` (no enum), to satisfy "don't hardcode relay names" literally. If the developer or orchestrator prefers a different shape (e.g. a `"<owner>: <text>"` string convention instead of an object), that's an open question -- flag it back to qa before diverging, since changing the shape means editing these tests, not just satisfying them.

**Next step**: developer implements `apps/organism-infra/schemas.mjs` against this branch's tests.

**Suggested skills**: `tdd`, `organism-protocol`.

**Gotchas**: Receipt's `worktree` field is shape-only per the ticket (organism-infra/16 computes real values) -- tests only check the two keys exist, not their values. `policy_version`/`rollback_point`/`artifact` are treated as opaque strings, no format validation implied by the ticket.
