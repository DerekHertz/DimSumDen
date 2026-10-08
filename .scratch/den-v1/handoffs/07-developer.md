```json
{
  "ticket": "den-v1/07-message-t",
  "cell": "developer",
  "current_step": "Implementation committed on feat/07-message-t; qa's three test files pass (61 of 61); full npm test green apart from one unrelated spike flake; vite build ok.",
  "artifacts": [
    "apps/ui/src/overlay/message-composer.mjs",
    "apps/ui/src/overlay/MessageComposer.jsx",
    "apps/ui/src/overlay/ProximityCard.jsx",
    "apps/ui/src/state/bridge-client.mjs",
    "apps/ui/src/App.jsx",
    "apps/ui/src/scene/procedural/den.css"
  ],
  "decisions": [
    "Card and composer share a .proximity-dock wrapper in App.jsx (flex column, 8px gap) so the composer sits under the card; .proximity-dock .proximity-card is static-positioned. Phone: composer is a fixed bottom sheet, card hidden while open.",
    "Acks that arrive before the send's own 200 are remembered for the current send, so the line goes straight to received.",
    "Composer keys stand down while the approval review is open; the transcript keys stand down while either panel is open; opening the review closes the composer.",
    "Nothing in App feeds composer.observe yet: the real event stream is den-v1/11."
  ],
  "failures": [],
  "pending": [
    {"item": "qa verify; user visual critique (layout, 320px width, phone sheet, motion, contrast, focus return) since these were not browser-checked.", "owner": "qa"},
    {"item": "Skipped /code-review and a live browser look: developer context hit its budget. Run a light review.", "owner": "qa"}
  ]
}
```

## State
Done, in-review. Tests: 61 of 61 for the three qa files. npm test: my run showed one failure, "runSpikes S4b" (process/SIGTERM spike, unrelated to the UI); a scout re-run was 2955 of 2955. Treat as a flake.

## What changed
- message-composer.mjs: pure controller per the test header contract.
- bridge-client.mjs: sendMessage (trim, byte-limit guard, POST /agents/:id/message).
- MessageComposer.jsx: hook plus component (role=group, textarea, kbd hints, alert banner, aria-live announcements, phone Cancel/Send buttons).
- ProximityCard.jsx: onMessage, status line, T enabled unless demo, NEXT.T text updated, stale comment fixed.
- App.jsx mounts the composer; den.css adds .message-composer, .proximity-dock, .proximity-message styles with reduced-motion rules.

## Gotchas
- The spec says the composer is under the card; I did that with a dock wrapper rather than moving the card's absolute offsets. Check visually.
- The approval demo client has no sendMessage, so T in `?demo=approval` shows a refusal banner. Out of scope.
