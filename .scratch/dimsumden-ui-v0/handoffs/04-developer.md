```json
{
  "ticket": "dimsumden-ui-v0/04-bridge-state",
  "cell": "developer",
  "current_step": "implemented; 22 bridge tests and full npm test (436) pass; released at in-review",
  "artifacts": ["apps/bridge/server.mjs", "apps/bridge/snapshot.mjs", "package.json (bridge script)", "branch feature/dimsumden-ui-v0-04-bridge-state"],
  "decisions": [
    "snapshot.mjs (async buildSnapshot(root, seq)) holds board reading; server.mjs holds HTTP, loopback bind and Host check",
    "readySince: newest events row with to_status ready-for-agent, else file mtime",
    "Orchestrator handoff timestamps are file mtimes",
    "Unmatched routes return 404 for now; static files, SSE, /metrics, POST /requests are tickets 05 and 06",
    "seq is always 0 until ticket 05 adds change events"
  ],
  "failures": [],
  "pending": [
    {"item": "security review; orchestrator merge", "owner": "qa/security"}
  ]
}
```

# Handoff: dimsumden-ui-v0/04 developer

## State
`GET /state` works via `startBridge({root, port, uiDir})`; binds 127.0.0.1, 403 on non-loopback Host. All qa tests pass unedited (22), full `npm test` 436 pass. No dependencies added.

## Notes for next cells
- `uiDir` is accepted but unused until static serving lands.
- Blocker tokens: `NN`, `feature/NN`, notes stripped; ref resolved by ticket number within the feature.
- Lock file: first two whitespace tokens (cell, ts); a third mode token is ignored.
- Added `bridge` npm script per ADR.

## Comments
None.
