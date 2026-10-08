# 142 qa specify: tests and fixtures written, NOT YET RUN (context stop)

```json
{
  "ticket": "organism-infra/142-steering-adapter-pure",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Tests and scrubbed fixtures committed as a WIP commit (98b0b97) on tests/142-steering-adapter-pure. The red run was never done: the cell hit its context stop before running node --test. A fresh qa cell must run the red check and apply two small fixes below, then hand off to the developer.",
  "artifacts": [
    "apps/bridge/cells/claude-adapter.test.mjs (branch tests/142-steering-adapter-pure @ 98b0b97)",
    "apps/bridge/cells/fixtures/s1.jsonl, s2.jsonl, s3-allow.jsonl, s3-deny.jsonl, s4b-eof.jsonl, s6b.jsonl, s8.jsonl (real captured lines, scrubbed)"
  ],
  "decisions": [
    "Interface pinned in the header of claude-adapter.test.mjs: buildClaudeArgs({sessionId,agent,model?}), CLAUDE_MODELS, buildClaudeEnv(parentEnv), MAX_LINE_BYTES, createLineSplitter({maxLineBytes?}).push(chunk), parseClaudeLine(line), decodeControlRequest(obj, seen:Set), encodeControlResponse({requestId,allow,reason?,input}).",
    "decodeControlRequest returns {kind:'approval',requestId,tool,input} | {kind:'deny',requestId} | {kind:'drop'}; duplicate request ids are tracked in a caller-owned Set.",
    "parseClaudeLine returns [] for control_request lines; they go through decodeControlRequest.",
    "Fixtures are committed by qa (reduced init lines, thinking signatures blanked, home path and username scrubbed with conformance.mjs scrubText) so decode tests rest on real captured lines.",
    "Whole-argv template pinned: -p --input-format stream-json --output-format stream-json --verbose --permission-prompt-tool stdio --session-id <uuid> --agent <role> [--model <m>] --setting-sources project,local --strict-mcp-config --settings {\"permissions\":{\"deny\":[\"Write(.claude/**)\",\"Edit(.claude/**)\"]}}."
  ],
  "failures": [
    "Tests were never executed. Expect red because claude-adapter.mjs does not exist; confirm each test fails with the message 'claude-adapter.mjs must export ...' and not a syntax or setup error."
  ],
  "pending": [
    {
      "item": "Run node --test apps/bridge/cells/claude-adapter.test.mjs; confirm red for the right reason (the fixture-hygiene tests and the committed-fixture presence test are guards that should already pass). Fix syntax errors if any.",
      "owner": "qa"
    },
    {
      "item": "Edit encodeControlResponse 'allow is the shape the CLI honoured' test: replace assert.equal(line, controlResponseLine(...)) with endsWith newline plus deepEqual of JSON.parse of both lines (the string equality is key-order brittle).",
      "owner": "qa"
    },
    {
      "item": "Edit the hostile-shapes list in parseClaudeLine tests: the entry '{ type: user, message: {...} === undefined ? 0 : { content: 5 } }' is a leftover that works but reads oddly; replace with { type: 'user', message: { content: 5 } } and { type: 'user', message: { content: [{ type: 'tool_result' }, null, 3] } }.",
      "owner": "qa"
    },
    {
      "item": "Open interpretation to settle in the developer handoff: usage event input counts. Test requires output == usage.output_tokens and input >= input_tokens (integer); ADR does not say whether cache tokens are included.",
      "owner": "qa"
    }
  ]
}
```

## Criterion to test map

| Criterion | Tests (claude-adapter.test.mjs) |
|---|---|
| Whole-argv equality; no permission-broadening flag constructible | "buildClaudeArgs: the fixed argv template": whole-argv equality; with a model; no permission-broadening flag for any role; the only flags the builder can emit; varying each parameter changes only its slot; rejects extra keys (extraArgs, allowedTools, permissionMode, ...), flag-shaped agent, bad session id, bad model, missing argument; fresh array per call |
| `--setting-sources project,local`, `--strict-mcp-config`, inline deny rule in `--settings` | same describe: "--setting-sources project,local and --strict-mcp-config are present", "--settings carries the inline deny rule ..." |
| Decoding against committed fixtures, duplicate request_id, non-can_use_tool subtype | "decodeControlRequest ... real S3 fixtures": decodes real request, permission_suggestions ignored, duplicate id denied, non-can_use_tool subtype denied, mistyped fields denied, no id dropped, 128/129 char ids, opaque keys (__proto__), non-control_request dropped; parseClaudeLine fixture table over all 7 fixtures; hostile lines; size cap |
| Fixtures hold no home paths or usernames | "committed fixtures": presence of the 7 files, no home path or username, no socket path/memory paths/signature blobs, every line a JSON object |
| Also from the ticket body | buildClaudeEnv allowlist tests; createLineSplitter size cap and resync; encodeControlResponse bare-decision tests (deep-equal updatedInput, no updatedPermissions, single-line output, fail-closed allow) |

No criterion is human-verified. The fixture-hygiene tests pass today by design (qa scrubbed the fixtures); they guard the developer if fixtures are regenerated.

## Next cell

A fresh qa cell finishes the red run and the two edits above, republishes, and releases to the developer. The developer implements apps/bridge/cells/claude-adapter.mjs only (plus adding nothing else); `policy.mjs` already exports ROLES and UUID_RE for reuse.
