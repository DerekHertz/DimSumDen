```json
{
  "ticket": "dimsumden-ui-v0/05-bridge-events",
  "cell": "qa",
  "mode": "specify",
  "current_step": "7 failing tests committed on tests/dimsumden-ui-v0-05-bridge-events",
  "artifacts": ["apps/bridge/bridge-events.test.mjs"],
  "decisions": [
    "Tests reuse bridge-fixture.mjs unchanged; SSE parsed with a small node:http client in the test file",
    "2 s criterion asserted as <= 2500 ms (ADR 2 s safety net plus 500 ms slack)",
    "Client reducer applyEvent (ADR decision 5) is not in this ticket's criteria; not tested here. Ticket 07 or a follow-up should own it, orchestrator to confirm"
  ],
  "failures": [],
  "pending": [{"item": "implement GET /events in apps/bridge/server.mjs", "owner": "developer"}]
}
```

# Handoff: 05 qa specify

## Criterion to test map
- "Touching a fixture ticket emits the ADR's change event within 2s": tests 2 (ticket edit, seq continuity), 3 (resolved gives ticket:null), 4 (usage.jsonl gives `usage` and `metrics-changed`), 5 (events.jsonl gives `metrics-changed`), 6 (new handoff gives ticket event with handoff text).
- "Client reconnect gets a fresh snapshot": test 7 (change made while disconnected; new connection's first frame is a snapshot showing it).
- ADR "snapshot first, text/event-stream, no-store": test 1.

## Red state
All 7 fail: `/events` returns 404 (no route). Not setup errors.

## Notes for developer
- Tests are timing based: they wait up to 2.5 s for a frame. Reconnect test sleeps 2.3 s.
- Not covered (untested ADR items): 15 s ping, back-pressure destroy.

## Comments
None.
