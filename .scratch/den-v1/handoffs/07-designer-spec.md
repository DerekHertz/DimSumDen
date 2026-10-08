```json
{
  "ticket": "den-v1/07-message-t",
  "cell": "designer",
  "mode": "spec",
  "current_step": "Spec final and signed off by the user (2026-10-08, mockup and defaults). Copy the spec below into the ticket, then qa specify.",
  "artifacts": [
    {
      "path": "https://claude.ai/artifact/1UZtso2ouLTLkhhQMvPUGR",
      "note": "Static mockup, 10 states: ready, typed, over 2 KB, sent, received, sent-not-yet-received, retryable refusal, sending and final refusal, disabled with reason, phone sheet."
    }
  ],
  "decisions": [
    "Placement: composer docks under the left card; right slot untouched (user)",
    "After send: composer closes, card shows a status line, latest message only (user)",
    "Enter sends, Shift+Enter adds a line (user)",
    "20s with no ack: card says 'Sent, not yet received' in lantern, no retry (user)",
    "2 KB counted in UTF-8 bytes; empty or whitespace-only is not sent; text trimmed; one in flight (user, defaults accepted)",
    "Esc closes the composer, a second Esc leaves walk mode; draft kept per agent until reload (user)"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Copy the spec into the ticket; qa specify maps each criterion and state to tests against a stub bridge client and a fixture acknowledgement event",
      "owner": "orchestrator"
    }
  ]
}
```

State: spec complete, user signed off. Ready for qa specify.

## Spec

### Flow
1. Card shows `T Message` enabled when the agent is live and `capabilities.send` is true (existing `cardFor` `actions.T`). Pressing **T** (key or card button) opens the **composer** docked under the card and focuses the text box. Nothing is sent.
2. **Enter** sends; **Shift+Enter** inserts a newline; **Esc** closes without sending (draft kept). On phone, the Send button sends and Cancel closes.
3. Send is refused in the UI, with no request, when the trimmed text is empty or its UTF-8 byte length is over 2,048. Over limit shows the `Too long` banner and the alarm counter.
4. A valid send calls `sendMessage(agentId, {text})` once (`POST /agents/:id/message`, session token attached by the injected fetch). The text is trimmed. In-flight guard: a second send, or T, while one is pending is dropped. Box is read-only and the footer reads `Sending` while pending.
5. 200: composer closes, focus returns to the scene (walk) or the card's T button (cursor free), draft cleared. The card gains the status line `Message sent` with a hollow dot and the first 40 characters of the text in quotes (plain text, ellipsis if longer).
6. The status line becomes `Message received` (filled `qi-fill` dot, text in `qi`) when the agent's event stream delivers the acknowledgement event for that message. Match on the id the bridge returned for the send (stub returns it; fixture ack carries it). An ack for any other message id is ignored.
7. If no ack arrives within 20 s of the 200, the line reads `Sent, not yet received` (lantern dot and text). A later ack still moves it to `Message received`. No retry button, no alarm colour.
8. Only the latest message is shown. Sending another replaces the line. The line follows the card's agent; it is dropped when the agent ends or the viewer leaves for another panda.
9. Refusal: composer stays open, text kept, banner `Not sent. <reason> Nothing changed. Press Enter to try again.` (400, 429, 5xx, network) re-enables sending, focus stays in the box. Final (401, 404, 409): banner with the bridge's reason (`Too late. ...` for 404/409, `Session ended: restart the bridge and reload.` for 401), box read-only, Close (Esc) is the only action.

### Bridge client (`apps/ui/src/state/`)
One new function on the existing client, injected so tests use a stub: `sendMessage(agentId, {text}) -> {ok, messageId}`. Failure rejects with `{status, reason}` as `getApproval` and `decide` do; `reason` is the bridge's `error` string as plain text. The UI never builds the token. Live wiring is den-v1/11.

### Layout
- Composer: a `panel` under the card, same width as the card (320px desktop), 8px gap (`space-2`), `surface-glass`, 1px `line`, `radius-l`, `shadow-panel`, padding `space-3`. Does not use the right-hand slot and does not close the transcript or review panels.
- Content: overline `Message <name>`; text area (min-height 64px, grows to 6 lines then scrolls; `surface-300`, `radius-m`, `body`, `pre-wrap`, `overflow-wrap:anywhere`); hint row `Enter send · Shift+Enter new line · Esc cancel` with `kbd` chips; counter row `One message, sent to this agent only` left, `n / 2,048 bytes` right (`small`, tabular-nums).
- Status line: on the card under the action keys, separated by a 1px `line` rule; dot 10px plus word plus quoted preview (`small`, `ink-muted` preview).
- Phone (<600px): composer is a bottom sheet (`left/right:16px; bottom:12px`), the card hides while it is open; 44px Cancel and Send buttons (Send solid `qi-fill`/`on-qi`).

### Tokens used (all exist)
surface-200, surface-300, surface-glass, line, line-strong, ink, ink-muted, qi, qi-fill, on-qi, lantern, alarm, alarm-zone, focus-ring, radius-m/l, space-1..3, shadow-panel, dur-fast, dur-base, ease-soft; type: body, small, overline, code-small.

### Keyboard and focus
- Opening focuses the text box. Tab order: text box, then Cancel/Send on phone.
- In the text box, letters type (no walk, A/D/F/T handling); Enter sends; Shift+Enter newline; Esc closes. The first Esc is consumed by the composer; a second leaves walk mode. IME composition (`isComposing`) never sends.
- Opening releases pointer lock; walk-key handling must not swallow Tab, Enter or Space inside the composer.
- Composer: `role="group"`, `aria-label="Message <name>"`; text box labelled by the overline; counter linked with `aria-describedby`. Banner `role="alert"`. Status line changes announce politely (`Message sent to dev-02.`, `Message received by dev-02.`, `Message sent, not yet received.`).

### States
| State | What shows |
|---|---|
| Ready | Empty box, placeholder `Tell <name> what to do next`, `0 / 2,048 bytes`, focus ring |
| Typed | Counter updates per keystroke, muted |
| Empty or whitespace only | Enter does nothing, no request |
| Over 2,048 bytes | Alarm border and counter, banner `Too long. n of 2,048 bytes. Shorten it by m bytes to send.`; Enter sends nothing |
| Sending | Box read-only, `Sending` with spinner, T ignored |
| Sent | Composer closed; card line `Message sent` hollow dot |
| Received | Card line `Message received`, filled dot |
| Sent, not yet received (20 s) | Card line in lantern |
| Refused, retryable | Banner, text kept, Enter retries |
| Refused, final | Banner with reason, box read-only, Esc closes |
| Disabled | T disabled on the card with the reason under the keys: `no agent running`, `agent controls unavailable`, `runtime cannot send messages`; composer does not open |
| Demo mode (den-v1/09) | T disabled, reason `Demo mode: actions are off` |
| Agent ended while open | Same as final, reason `Agent ended: <state>` |
| Draft | Closing with Esc keeps the text per agent until reload; reopening restores it |
| Reduced motion | No fade, slide or spinner rotation (static glyph plus the word) |
| Motion allowed | Composer fades in over `dur-base` with `ease-soft` plus 8px slide up; dot cross-fades over `dur-fast` |
| Light and dark | Tokens only; text 4.5:1 on `surface-glass` and `surface-300`; dots, icons and focus ring 3:1 |

### Copy
`Message <name>` / `Tell <name> what to do next` / `Enter send` / `Shift+Enter new line` / `Esc cancel` / `One message, sent to this agent only` / `n / 2,048 bytes` / `Too long.` / `Sending` / `Not sent.` / `Too late.` / `Message sent` / `Message received` / `Sent, not yet received` / `Cancel` / `Send`. Sentence case, no emoji, every state is a word as well as a colour. Refusal text is the bridge's `error` string inserted as plain text.

### Accessibility
WCAG 2.1 AA. 2px `focus-ring` at 2px offset. 44px targets on phone. Lantern means waiting; alarm appears only in the banner and the over-limit counter, always with the word. The banner never steals focus.

## For qa specify (criteria mapping)
1. Enter sends exactly one `sendMessage` call with the trimmed text and the token attached by the injected fetch; Esc sends nothing; Shift+Enter, IME composition and T alone send nothing.
2. Over 2,048 UTF-8 bytes (test with multi-byte characters) refused with no call; empty and whitespace refused; exactly 2,048 bytes sends.
3. Status: sent after 200; received when the fixture ack event with the returned message id arrives; ack for another id ignored; `Sent, not yet received` at 20 s (fake timers) and recovers on a late ack.
4. Refusal: reason shown verbatim as text; 400, 429, 5xx, network keep the box live and text kept; 401, 404, 409 lock it.
5. Guards: double send dropped while in flight; draft kept on Esc and restored; disabled reasons match `cardFor`; demo mode disables T.
6. Stub bridge client and fixture events only; no network.
7. `npm test` green.
No browser-measurement tests: the layout comes from the mockup.

## Hand-off notes
This ticket builds `sendMessage`, the composer and the card status line; den-v1/11 wires the live runtime (organism-infra/107). Token acquisition is not in this ticket; the client uses the injected fetch. The ProximityCard's `NEXT.T` text (`Messaging coming next`) and its "T stays read-only" comment need updating.
