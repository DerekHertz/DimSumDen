# 142 developer: claude-adapter.mjs written, 74/74 tests green, in-review

```json
{
  "ticket": "organism-infra/142-steering-adapter-pure",
  "cell": "developer",
  "current_step": "apps/bridge/cells/claude-adapter.mjs implemented on feat/142-steering-adapter-pure @ 79df91a (on top of tests @ 8756d90). claude-adapter.test.mjs 74/74 pass, unedited; npm test 2558 pass 0 fail; npm run risk-check clean. Ready for qa verify (light).",
  "artifacts": [
    "apps/bridge/cells/claude-adapter.mjs"
  ],
  "decisions": [
    "Usage input = input_tokens + cache_creation_input_tokens + cache_read_input_tokens (the context the model read); output = output_tokens. The host replaces agent.tokens on each usage event, so each assistant line's usage is a snapshot. An assistant line without an integer output_tokens gives no usage event.",
    "CLAUDE_MODELS = [opus, sonnet, haiku] (the CLI aliases). The ADR names no list; change the constant if the owner wants pinned model ids.",
    "MAX_LINE_BYTES = 1,000,000. parseClaudeLine also returns [] for a line over the cap, so it is safe without the splitter.",
    "decodeControlRequest adds every usable request id to the caller's seen set, including ones it answers deny, so a denied id cannot return as an approval. Once seen.size reaches REQUEST_IDS_PER_AGENT (policy.mjs, 1000) every new request is answered deny without being remembered.",
    "encodeControlResponse truncates a deny reason to 500 chars, defaults it to 'Denied by the owner.', escapes U+2028 and U+2029 so the stdin line stays one line, and throws on a bad request id or an allow without a plain-object input. Only allow === true allows.",
    "tool-start summary is the first non-empty of command, file_path, path, pattern, url, description, control characters flattened, cut at 200 chars; no full tool input leaves the parser.",
    "buildClaudeEnv keeps PATH, HOME, LANG, LC_[A-Z]+, DEN_CLAUDE_BIN and only string values; it takes no second argument."
  ],
  "failures": [],
  "pending": [
    {
      "item": "qa verify (light): rerun node --test apps/bridge/cells/claude-adapter.test.mjs and review the adapter against ADR 0016 6.5, 6.6, 6.8.",
      "owner": "qa"
    },
    {
      "item": "143 wires these functions into the spawn/stdin half; it decides where the per-child seen Set lives and maps approval/deny/drop to permission-request CellEvents.",
      "owner": "developer"
    }
  ]
}
```

No criterion is human-verified. The /code-review skill was not run as a separate sub-agent pass: the file is 221 lines, every function is covered by qa's 74 tests, and the changes were reread against ADR 0016 6.5 to 6.8 while writing.
