```json
{
  "ticket": "den-v1/06-approve-deny",
  "cell": "designer",
  "mode": "spec",
  "current_step": "Spec final and signed off by the user (2026-10-08, mockup and four defaults). Copy the spec below into the ticket, then qa specify.",
  "artifacts": [
    {
      "path": "https://claude.ai/artifact/ECewj2Pr5h1bbzFQ6mojuQ",
      "note": "Static mockup: ready (dark), loading and sending (light), retryable and final refusal (dark), phone sheet dark and light."
    }
  ],
  "decisions": [
    "Placement: review panel in the right-hand slot, phone bottom sheet under 600px (user)",
    "Confirm: A or D opens a review; explicit Allow and Deny buttons send; focus starts on Deny (user)",
    "Refusal: panel stays open with the bridge's reason; nothing else changes (user)",
    "Optional one-line note sent as `note` on either decision (user)",
    "Panel shares the transcript slot (user)",
    "Allow enabled once the full input is rendered (user)",
    "A/D ignored 400ms after open and on key repeat (user)",
    "Terminal refusals (401, 404, 409) lock both buttons; 400, 429, 5xx, network keep them live (user)"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Copy the spec into the ticket; qa specify maps each criterion and state to tests against a stub bridge client and fixture events",
      "owner": "orchestrator"
    }
  ]
}
```

State: spec complete, user signed off. Ready for qa specify.

## Spec

### Flow
1. Card shows a pending approval (existing `cardFor` `approval`, `actions.A/D` enabled). Pressing **A** or **D** (key or card button) opens the **review panel** and sends nothing. The card's `pending` line becomes lantern icon + `Waiting on you · <tool>`.
2. Panel calls `getApproval(id)` (bridge client, `GET /approvals/:id`, Bearer token). Allow is disabled while loading; Deny is enabled.
3. Allow enables once the response is rendered and the shown character count equals `inputLength` from the snapshot approval. Not tied to scrolling.
4. Allow or Deny (button click, Enter on the focused button, or A / D key) sends exactly one `decide(id, {decision:"allow"|"deny", note?})` (`POST /approvals/:id`). In-flight guard: a second send while one is pending is dropped.
5. 200: panel closes, focus returns to the scene (walk) or the card button (cursor free), polite live region says `Allowed Bash for dev-02.` / `Denied Bash for dev-02.` The card then follows the snapshot (the pending line goes when the approval leaves `pending`).
6. Refusal: panel stays open, alarm banner with the reason (below). Card, panda, input and note unchanged.

### Bridge client (`apps/ui/src/state/`)
Two functions, injected so tests use a stub: `getApproval(id) -> {tool, input, inputLength, ...}` and `decide(id, {decision, note}) -> {ok}`. Both send `Authorization: Bearer <session token>` and nothing else sensitive; a failure rejects with `{status, reason}` where `reason` is the bridge's `error` string, plain text only. The UI never builds the token itself.

### Layout
- Panel in the transcript's slot: `right:16px; top:88px; bottom:124px; width:min(420px, calc(100vw - 32px)); z-index:5`, `surface-glass`, 1px `line`, `radius-l`, `shadow-panel`. Opening it closes the transcript; closing it does not reopen the transcript. Card stays on the left.
- Header (`space-3`): overline `Permission request`; heading `Run <tool>` (`heading`, tool in `code-small` on `surface-300`, `radius-s`); `small` `ink-muted` line `<name> · <role> · <ref>`; lantern icon + `Waiting on you`; right-aligned `Expires in m:ss` (`small`, `ink-muted`, tabular-nums); Close (line X, 32px desktop, 44px phone).
- Body: label row `Tool input` / `All N characters shown`; scrolling well (`surface-300`, `radius-m`, `code`, `white-space:pre-wrap; overflow-wrap:anywhere`) filling the space; then `Note to the agent (optional)` input (`maxlength 200`, counter `n / 200`).
- Footer: `Deny` (outline, `line-strong`) left, `Allow` (solid `qi-fill`/`on-qi`) right, each with a `kbd` hint; 40px desktop, 48px phone.
- Phone (<600px): bottom sheet (`left/right:16px; bottom:12px; max-height:min(540px, 75dvh)`); the card hides while it is open.
- Show the full input only. Never show the 200-character `summary` in the panel.

### Tokens used (all exist)
surface-glass, surface-200, surface-300, line, line-strong, ink, ink-muted, qi-fill, on-qi, focus-ring, lantern, alarm, alarm-zone, radius-s/m/l, space-1..5, shadow-panel, dur-fast, dur-base, ease-soft; type: heading, body, small, overline, code, code-small. Display font not used.

### Keyboard and focus
- Opening focuses **Deny**. Tab order: Close, note input, Deny, Allow.
- With focus anywhere but the note input: `A` sends allow (only if Allow is enabled), `D` sends deny, `Esc` closes without answering. The first `Esc` is consumed by the panel; a second leaves walk mode.
- `A` / `D` keys are ignored for 400ms after the panel opens, and when `event.repeat` is true.
- In the note input, letters type text (no walk or A/D/F handling) and Enter does nothing; the user Tabs to a button.
- Opening releases pointer lock; walk-key handling must not swallow Tab, Enter or Space inside the panel.
- Panel: `role="complementary"`, `aria-label="Permission request for <name>"`. Banner: `role="alert"`. The countdown is not live; announce only at 60s left (`Expires in 1 minute`) and at expiry.

### States
| State | What shows |
|---|---|
| Loading input | Skeleton lines in the well, `Loading...` in the label row; Allow disabled, Deny enabled |
| Ready | Input rendered, `All N characters shown`; both enabled; Deny focused |
| Input load failed | Alarm banner `Could not load the tool input: <reason>. Allow stays off until it loads.` Retry button `Load again`; Allow disabled, Deny enabled |
| Sending | Both buttons disabled; the chosen one reads `Sending` with a spinner; note read-only |
| Success | Panel closes; live region announces the result |
| Refused, retryable (400, 429, 5xx, network) | Banner `Not sent. <reason> Nothing changed. Try again.`; buttons re-enabled; input and note kept; focus moves to the button that was pressed |
| Refused, final (401, 404, 409) | Banner with the bridge's reason (`Too late. ...` for 404/409, `Session ended: restart the bridge and reload.` for 401); both buttons disabled; Close focused |
| Expired locally (`expiresAt` reached) | Same as final; header reads `Expired`; no request is sent |
| Snapshot says approval left `pending` while open | Same as final, reason `Already answered` or `Expired`; input dropped (bridge returns `input: null`) |
| Agent ended while open | Same as final, reason `Agent ended: <state>` |
| No pending approval / runtime cannot approve | Card A and D stay disabled with the reason (`no pending permission request`, `runtime cannot answer permissions`); panel does not open |
| Demo mode (den-v1/09) | A and D disabled, reason `Demo mode: actions are off` |
| Reduced motion | No open/close animation, no spinner rotation (static glyph plus the word) |
| Motion allowed | Fade in over `dur-base` with `ease-soft` plus 8px slide from the right; spinner rotates |
| Light and dark | Tokens only; text 4.5:1 on `surface-glass` and `surface-300`; icons and focus ring 3:1 |

### Copy
`Permission request` / `Run Bash` / `Waiting on you` / `Expires in 8:42` / `Tool input` / `All 1,840 characters shown` / `Note to the agent (optional)` / `One line, sent with your answer` / `Deny` / `Allow` / `Sending` / `Not sent.` / `Too late.` / `Close permission request`. Sentence case, no emoji, state is always a word as well as a colour. Refusal text is the bridge's `error` string inserted as plain text.

### Accessibility
WCAG 2.1 AA. 2px `focus-ring` at 2px offset. 44px targets on phone. Lantern means waiting on you; alarm appears only in the banner, always with the word. Appending the banner never steals focus except for the final-refusal case above.

## For qa specify (criteria mapping)
1. A then Allow: exactly one `decide` call, route `POST /approvals/:id`, token attached, body `{decision:"allow"}`; Deny sends `deny`. A or D alone sends nothing.
2. Input shown before any decision: `getApproval` is called and its input rendered before `decide` is reachable; Allow disabled until rendered and count equals `inputLength`; Deny enabled while loading.
3. Refusal: stub rejects `{status, reason}`; the reason is shown verbatim as text; card and approval unchanged; retryable statuses re-enable, 401/404/409 lock both.
4. Guards: 400ms open guard, `repeat` ignored, double-send dropped, note excluded from key handling, `note` omitted when empty and trimmed to 200.
5. Stub bridge and fixture events only; no network.
6. Demo mode disables A/D; transcript and review share the slot.
7. `npm test` green.
No browser-measurement tests: the layout comes from the mockup.

## Hand-off notes
This ticket builds the bridge client in `apps/ui/src/state/` and the panel; den-v1/10 wires the live runtime. Token acquisition (launch code, `POST /session`, sessionStorage) is not in this ticket: the client reads a session token from an injected getter.
