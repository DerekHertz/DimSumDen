```json
{"ticket": "dimsumden-ui-v0/10-panel-gates", "cell": "developer", "mode": null, "status": "in-review", "current_step": "implemented, committed on feat/dimsumden-ui-v0-10-panel-gates", "branch": "feat/dimsumden-ui-v0-10-panel-gates", "artifacts": ["apps/ui/src/panel/gates-model.mjs", "apps/ui/src/panel/Panel.jsx", "apps/ui/src/App.jsx", "apps/ui/src/styles.css"], "decisions": ["Gates section is filtered out of App SECTIONS when gatesModel(snapshot).visible is false", "Non-409 errors use message 'Couldn't send: request failed (<status>)'; 409 locks the buttons for that card", "Note echo in pending state omitted: ticket.request carries no note"], "failures": [], "pending": [{"item": "qa verify, browser smoke of Approve (one request line, shows pending), designer review", "owner": "qa"}]}
```

# Handoff: 10 developer

## State
The gates model passes qa's tests. `npm test` gives 631 of 631 passing, and `vite build` succeeds. I did not run a formal /code-review or the browser smoke, so the smoke stays with qa and designer.

## Changes
- `gates-model.mjs`: `gatesModel`, `noteCounter`, `submitGate`.
- `Panel.jsx`: `Gates` and `GateCard`. The card has a note textarea (max 500, counter from 450), "Sending..." buttons that are disabled while in flight, an inline error, and a pending line in an `aria-live="polite"` region.
- `App.jsx`: the "Needs you" section with a count badge, hidden when there are no gates.
- `styles.css`: gate card, button and error styles.

## Next step
qa verify.

## Gotchas
The pending mark is derived from `ticket.request`, so it clears when the ticket event arrives with `request: null`. The optimistic "Sending..." state resets after the POST returns. The card shows pending only after the next snapshot event.

## Comments
None.
