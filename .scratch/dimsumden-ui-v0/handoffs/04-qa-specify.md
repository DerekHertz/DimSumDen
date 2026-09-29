```json
{
  "ticket": "dimsumden-ui-v0/04-bridge-state",
  "cell": "qa",
  "mode": "specify",
  "current_step": "specify done: failing tests committed, red because apps/bridge/server.mjs is missing",
  "artifacts": [
    "apps/bridge/bridge-state.test.mjs",
    "apps/bridge/bridge-fixture.mjs",
    "branch tests/dimsumden-ui-v0-04-bridge-state @ 3eaeb2c144fbf8b623eafb02df22ea8929b1ee5f"
  ],
  "decisions": [
    "Fixture builder is a new apps/bridge/bridge-fixture.mjs (locks, events verdict rows, _handoffs, usage, requests), not an edit of board-fixture.mjs",
    "Ticket fixtures set no events rows for ready tickets, so readySince falls back to file mtime (ADR recommended source)",
    "Host-header 403 test included (ADR decision 2 hardening applies to every route)"
  ],
  "failures": [],
  "pending": [
    {"item": "Implement apps/bridge/server.mjs exporting startBridge({root, port, uiDir}); make tests pass without editing them", "owner": "developer"}
  ]
}
```

# Handoff: dimsumden-ui-v0/04 qa specify

## State
Tests fail with ERR_MODULE_NOT_FOUND on `apps/bridge/server.mjs` (the missing feature). Test runner is `node --test`, picked up by `npm test` (`apps/**/*.test.mjs`).

## Criterion to test map
- `/state` matches the ADR shape: `apps/bridge/bridge-state.test.mjs`, describe "GET /state on a fixture tree" (envelope, sort, title/type, status, ready/blockedBy, priority/readySince, sessions, bump, frontier, holder/lastCell, blockedReason, gate, request, handoff and 8 KB cap, usage, requests), plus "with a claim lock" (holder, frontier exclusion, no dispatch gate) and "on an empty .scratch/".
- Binds to 127.0.0.1 only: describe "network binding" (url host, non-loopback interface refuses, foreign Host header is 403).
- human-verified: none.

## Caller duties from 02 (priority.mjs)
Tests pin: only `*-orchestrator-*.md` handoffs count (sessions = 3, an architect file ignored); day-only names converted per the header rule (fixture files carry 2026-09-28 mtimes, so mtime or end-of-day both work). Bump case: P1 ticket with mtime 09-20 becomes P0, bumps 1.

## Notes for developer
- `readySince` is asserted only as ISO non-null for ready tickets, null otherwise. Frontier order relies on mtime fallback (no events rows for those tickets).
- Fixture lock file is `developer <ISO>`; the real file may carry a third token (mode), which the parser should tolerate.
- 8 KB cap test allows any cut at or under 8192 bytes that is a prefix of the file.
- ADR says ticket 04 adds the `bridge` npm script; not tested.
- SSE, /metrics, POST /requests and static files are out of scope here (tickets 05, 06).

## Comments
None.
