```json
{
  "ticket": "dimsumden-ui-v0/04-bridge-state",
  "cell": "developer",
  "current_step": "security findings 1 and 2 fixed; npm test 437 pass; released at in-review",
  "artifacts": ["apps/bridge/server.mjs", "apps/bridge/bridge-robustness.test.mjs"],
  "decisions": [
    "Handler body moved to handle(); the http callback wraps it in try/catch and returns a generic 500 (detail logged to stderr)",
    "Bad request target (URL parse failure) returns 400",
    "New test lives in its own file so qa's tests stay untouched"
  ],
  "failures": [],
  "pending": [{"item": "verify, then orchestrator merge", "owner": "qa/orchestrator"}]
}
```

# Handoff: 04 developer fix round

## State
- Finding 1 (medium): raw `GET //` now gets 400 and the server keeps serving. Test: `apps/bridge/bridge-robustness.test.mjs`.
- Finding 2 (low): 500 body is `internal error`; the stack goes to stderr.
- Finding 3 (forward-looking): untrusted handoff text must be rendered as text by ticket 07; nothing to do here.

## Comments
None.
