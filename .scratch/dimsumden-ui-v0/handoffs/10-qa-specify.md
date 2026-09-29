```json
{"ticket": "dimsumden-ui-v0/10-panel-gates", "cell": "qa", "mode": "specify", "status": "ready-for-agent", "current_step": "failing tests committed on tests/dimsumden-ui-v0-10-panel-gates", "branch": "tests/dimsumden-ui-v0-10-panel-gates", "artifacts": ["apps/ui/src/panel/gates-model.test.mjs"], "decisions": ["Seam is a pure module apps/ui/src/panel/gates-model.mjs (gatesModel, noteCounter, submitGate) per ADR 0011 decision 8; Panel.jsx wires it", "submitGate takes an injected fetch so it is tested without a browser"], "failures": [], "pending": [{"item": "developer implements gates-model.mjs and the Gates section in Panel.jsx", "owner": "developer"}]}
```

# Handoff: 10 qa specify

## State
Tests committed; all fail with ERR_MODULE_NOT_FOUND for `apps/ui/src/panel/gates-model.mjs` (the missing feature). Branch `tests/dimsumden-ui-v0-10-panel-gates`, based on 7cb0a94.

## Interface pinned
- `gatesModel(snapshot) -> { visible, count, cards: [{ref, title, eyebrow "MERGE"|"DISPATCH", approveLabel, rejectLabel "Reject", approveKind, rejectKind, pending: null | {verdict "approve"|"reject", text}}] }`. Pending comes from `ticket.request.kind`; text is the spec's "Approval sent, waiting for the orchestrator" / "Rejection sent, waiting for the orchestrator".
- `noteCounter(len) -> {show, text}`: shown from 450, text "450/500".
- `submitGate({fetch, ref, kind, note?}) -> {ok:true} | {ok:false, status, message, retryable}`: one `fetch("/requests", POST, JSON)`; blank note omitted; 409 gives "Couldn't send: already pending (409)" and retryable false; other errors and network failures "Couldn't send: ..." and retryable true.

## Criterion to test map
- "Pressing Approve creates one request line and shows it pending (browser smoke)": human-verified in browser smoke (request line written, card shows pending). Partly covered by tests "submitGate POSTs exactly one JSON request..." and "a ticket with a pending approve request shows the approval-sent line".
- "A handled request clears its pending mark (test)": "a handled request clears its pending mark (ticket event with request null)" and "a handled merge whose ticket loses its gate drops the card and hides the section".
- Spec section 4 extras also tested: hidden when no gates, per-kind labels, note counter, 409 not retryable, network error, no snapshot mutation.

## Not tested (human-verified / UI wiring)
Buttons disabled and "Sending..." while in flight, textarea max 500, aria-live, focus ring, glow: React wiring in Panel.jsx.

## Next step
developer.

## Suggested skills
tdd, implement.

## Gotchas
The ticket says "Designer reviews after qa" so the browser smoke belongs to that pass.

## Comments
None.
