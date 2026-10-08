```json
{
  "ticket": "den-v1/06-approve-deny",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed on feat/06-approve-deny (23f45be). All 3 files fail with ERR_MODULE_NOT_FOUND for modules the developer must create (missing feature, no syntax or setup errors).",
  "artifacts": [
    "apps/ui/src/state/bridge-client.test.mjs",
    "apps/ui/src/overlay/approval-review.test.mjs",
    "apps/ui/src/overlay/approval-wiring.test.mjs"
  ],
  "decisions": [
    "The signed-off spec names no module or function names beyond getApproval and decide, so qa pinned them. Each contract is in the header of its test file: bridge-client.mjs (createBridgeClient), approval-review.mjs (createApprovalReview controller), pendingLine in proximity-card.mjs, ApprovalPanel.jsx.",
    "The controller is a DOM-free object with injected client, clock and hooks, so every state in the spec table is testable without a browser. React only renders its getState() and forwards keys, clicks and the snapshot.",
    "The bridge client takes session.fetch as its fetch (it already attaches the Bearer token and ends the session on 401). The tests build a real createSession over a stub fetch to prove the token is attached; the client source must not contain Bearer or storage.",
    "Shown character count is the length of the compact JSON of the input the bridge returned (matches the bridge's inputLength = JSON.stringify(input).length). Allow stays off when it differs from the snapshot's inputLength. Display text may be pretty-printed; control and bidi characters must be shown as escapes (/202e/i), never raw.",
    "press() must set the sending state synchronously (before its first await); the double-send and sending-state tests depend on it. The 400ms guard applies to keys, not to button presses.",
    "Banner copy pinned exactly: retryable 'Not sent. <reason> Nothing changed. Try again.'; load failure 'Could not load the tool input: <reason>. Allow stays off until it loads.'; 404/409 start with 'Too late.' and include the reason; 401 includes 'Session ended: restart the bridge and reload.'; snapshot-settled includes 'Already answered' or 'Expired'; agent ended includes 'Agent ended: <state>'.",
    "Approval state is read from `state ?? status` (the bridge sends state; cardFor's tests use status). An approval missing from the snapshot counts as left pending.",
    "Slot swap with the transcript and pointer-lock release are done through hooks.onOpen (the app wires closeTranscript and releaseCursor); only the hook call is tested."
  ],
  "failures": [],
  "pending": [
    { "item": "Create state/bridge-client.mjs, overlay/approval-review.mjs, overlay/ApprovalPanel.jsx, pendingLine in proximity-card.mjs (and render it in ProximityCard.jsx), App.jsx wiring, CSS (.approval...), per the spec in the ticket; make the 3 test files pass without editing them; npm test green (existing proximity-card.browser and transcript-wiring tests must stay green)", "owner": "developer" }
  ]
}
```

## Contracts (each is also in the header of its test file)

- `apps/ui/src/state/bridge-client.mjs`: `createBridgeClient({ fetch })` returns `{ getApproval(id), decide(id, {decision, note?}) }`. GET and POST `/approvals/<encodeURIComponent(id)>`, JSON body, rejects `{status, reason}` (reason is the bridge's `error` string, fallback text otherwise, status 0 for a thrown fetch). `decision` other than allow or deny rejects with no request.
- `apps/ui/src/overlay/approval-review.mjs`: `createApprovalReview({ client, now, hooks:{onOpen} })` with `getState`, `subscribe`, `open(card,{mode,demo})`, `key(event,{card,mode,demo})` returning `{handled, walk}`, `press`, `setNote`, `retryLoad`, `close`, `sync({approvals,agents})`, `tick`. State fields are listed in the test header.
- `proximity-card.mjs`: `pendingLine(card)` returns `Waiting on you · <tool>` or null.
- `ApprovalPanel.jsx` mounted in `App.jsx`; `ProximityCard.jsx` renders `pendingLine`.

## Criterion to test map

| Criterion | Test |
|---|---|
| 1 A then confirm sends exactly one allow with token, D sends deny | bridge-client.test.mjs (one POST, route, Bearer through a real session, body); approval-review.test.mjs 'sending' (one decide with the id and bare body, double-send dropped, keys A/D after the guard); 'A and D open the review; nothing is sent' |
| 2 Input shown before any decision | approval-review.test.mjs 'the tool input is shown before any decision' (loading, Allow blocked, ready, every Allow-on state carries input, length mismatch, control chars, stale response) |
| 3 Refused request shows reason, changes nothing | approval-review.test.mjs 'a refusal' (retryable 400/429/500/502/0, final 401/404/409, plain-text reason, frozen card untouched), 'loading the input can fail', 'the snapshot can end the approval', 'expiry'; bridge-client.test.mjs 'failures reject' |
| 4 Stub bridge and fixtures, no live runtime | all three files use stubs; approval-wiring.test.mjs poisons global fetch and scans for network primitives |
| 5 `npm test` green | developer and verify run it |
| Scope: pending line, copy, roles, XSS, reduced-motion CSS present | approval-wiring.test.mjs |
| Guards: 400ms, repeat, note, Esc, walk keys | approval-review.test.mjs 'keys', 'the note' |
| Demo mode, transcript slot | demo reason tested; slot swap is hooks.onOpen (call tested, wiring human-verified) |

## human-verified (the user critiques the UI)

Panel layout and 420px width, phone bottom sheet under 600px with the card hidden, header and footer styling, 32/44/40/48px targets, lantern icon and spinner, fade and slide motion and reduced-motion behaviour (only CSS presence is tested), contrast in light and dark, focus rings, Enter on a focused button, real focus placement and return, pointer-lock release, live region actually announcing, transcript closing when the review opens, and the live runtime (den-v1/10).

## Notes for the developer

- Do not edit the three test files. A contract that looks wrong: ask the orchestrator, do not loosen the test.
- Not specified, left to you: the exact `meta` when ref is null, the wording of the expiry announcement and banner (non-empty is all that is tested), the load-failed-with-401/404 handling, how a snapshot flip during `sending` resolves.
- The countdown is floored or ceiled either way: tests use whole-second offsets.
