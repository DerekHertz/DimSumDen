```json
{
  "ticket": "den-v1/07-message-t",
  "cell": "developer",
  "current_step": "Fix round 1 committed (c1229c5) on feat/07-message-t: the dev-only ?demo=approval stub now takes a message and acks it, so every composer state is visible before the user's critique.",
  "artifacts": [
    "apps/ui/src/scene/approval-fixture.mjs",
    "apps/ui/src/scene/approval-fixture.test.mjs",
    "apps/ui/src/App.jsx"
  ],
  "decisions": [
    "Demo agent capabilities.send is now true, so T is enabled on its card under ?demo=approval.",
    "client.sendMessage resolves {ok, messageId: demo-message-N}; 404 for an unknown agent; &refuse=<status> refuses sends too.",
    "Ack delay is 2000 ms via an injectable schedule (default setTimeout) so tests use no real timers. A message matching /noack/i gets no ack, so 'Sent, not yet received' shows after 20 s.",
    "The demo exposes onEvent(fn) -> unsubscribe; App.jsx feeds it to message.composer.observe in a useEffect that is a no-op when there is no approval demo. Production path unchanged (the demo is still gated on import.meta.env.DEV)."
  ],
  "failures": [],
  "pending": [
    {"item": "User visual critique in npm run ui with ?demo=approval (type a message, Enter; add 'noack' for the stalled line; &refuse=429 or 409 for the refusal states).", "owner": "orchestrator"}
  ]
}
```

## State
Fix round 1 done, in-review. npm test 2963 of 2963 green, 0 skipped. Vite build ok. Context 50k, no code-review run (small, test-covered change).

## What changed
- approval-fixture.mjs: sendMessage, onEvent, send capability, ack schedule.
- approval-fixture.test.mjs: 8 new tests, including an end-to-end run through the real composer controller (sent then received; noack stays sent).
- App.jsx: one useEffect wiring demo acks into composer.observe.

## Gotchas
- The scheduled ack timer is not cancelled on unmount; harmless in the dev-only demo.
- Live wiring of the event stream stays den-v1/11.
