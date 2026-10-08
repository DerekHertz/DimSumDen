```json
{"ticket": "den-v1/07-message-t", "cell": "qa", "mode": "specify", "current_step": "Failing tests committed on feat/07-message-t (5b46f9d); all fail for missing modules or features.",
 "artifacts": ["apps/ui/src/state/bridge-client-message.test.mjs", "apps/ui/src/overlay/message-composer.test.mjs", "apps/ui/src/overlay/message-wiring.test.mjs"],
 "decisions": ["Composer controller is apps/ui/src/overlay/message-composer.mjs, modelled on approval-review.mjs (injected client and now, tick() clock, no timers).", "Ack fixture event shape is { type: 'message-ack', agentId, messageId }; den-v1/11 maps the real runtime event to it.", "Bytes limit is measured on the trimmed text; counter on raw text."],
 "failures": [],
 "pending": [{"item": "Make the three test files pass: sendMessage in bridge-client.mjs, message-composer.mjs, MessageComposer.jsx, ProximityCard status line and onMessage, App.jsx mount, .message-composer CSS.", "owner": "developer"}]}
```

## State
Done. Specify complete, tests red for the right reasons (ERR_MODULE_NOT_FOUND, missing sendMessage, missing JSX and CSS).

## What changed
Branch `feat/07-message-t`, commit 5b46f9d (tests only). Base f2185bb.

## Criterion-to-test map
- Enter sends exactly one request with text and token; Esc cancels: `bridge-client-message.test.mjs` (POSTs /agents/:id/message with Bearer token via the session fetch); `message-composer.test.mjs` "Enter sends exactly one request", "while open, the box owns the keyboard" (Esc, Shift+Enter, IME, T alone, in-flight guard).
- Over 2 KB refused before sending: `message-composer.test.mjs` "size and emptiness are refused..." (multi-byte, 2,048 exact sends, 2,049 refused, empty/whitespace); same guard in `bridge-client-message.test.mjs`.
- Sent, then received on ack: `message-composer.test.mjs` "a successful send" (ack by id, other id ignored, replacement, 20 s stalled via tick(), late ack recovers), "status line follows the card's agent".
- Stub client and fixture ack, no live runtime: all tests use stubs; "no live runtime is needed" poisons global fetch; wiring test bans network primitives in the controller.
- Refusals, drafts, disabled reasons, demo mode, agent ended: `message-composer.test.mjs` "refusals" (400/429/500/503/network retry; 401/404/409 final), "drafts", "disabled and demo" (uses real cardFor reasons), "agent ended while open".
- Wiring (App mount, card status line, copy, roles, aria, reduced-motion CSS, no innerHTML): `message-wiring.test.mjs`.
- `npm test` green: the developer's gate; the suite is red until the three files pass.
- human-verified: layout, 320px width and gap, phone bottom sheet, fade and slide motion, dot cross-fade, contrast, focus ring, focus-return feel, spinner.

## Contract the developer must meet
Read the header comments of `message-composer.test.mjs` (controller API, state fields) and `bridge-client-message.test.mjs`. I proved the controller tests are satisfiable with a throwaway reference implementation (53 of 53 pass; not committed).

## Next step
developer: implement, keep every assertion. Also update ProximityCard NEXT.T text and the "T stays read-only" comment.

## Gotchas
- cardFor reports `no agent running` for an ended agent (not `agent controls unavailable`); the test encodes that.
- Preview quotes may be straight or curly; the test accepts either.
