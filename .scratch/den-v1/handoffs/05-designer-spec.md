```json
{
  "ticket": "den-v1/05-transcript-f",
  "cell": "designer",
  "mode": "spec",
  "current_step": "DRAFT UI spec below, NOT signed off by the user. Context budget hit before the interactive review. A fresh designer (or the orchestrator with the user) must walk the user through the open questions, get sign-off, then copy the final spec into the ticket.",
  "artifacts": [],
  "decisions": [
    "Transcript is a side panel at the right of the walk-mode view, not a modal, so the panda and card stay visible",
    "Reuse existing tokens and the .proximity-card / .panda-detail visual language (surface-glass, line, radius-l, shadow-panel)"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Review the draft spec with the user: answer Open questions 1-6, get sign-off, write the final spec into the ticket, add story 23 (token) to criteria, make the static HTML/SVG mockup",
      "owner": "designer"
    },
    {
      "item": "After sign-off: qa specify maps every criterion and every state below to tests",
      "owner": "qa"
    }
  ]
}
```

State: draft only. The user has NOT signed off. Do not send to qa specify until they have.

## What I found (so the next cell skips exploration)

- den-v1/04 is merged. `apps/ui/src/overlay/ProximityCard.jsx` already renders F as a disabled button reading "Transcript coming next"; `proximity-card.mjs` `cardFor` already returns `actions.F = {enabled, reason}` with reason "no agent running" for a resident panda. 05 turns that button on.
- Card CSS lives in `apps/ui/src/scene/procedural/den.css` (`.proximity-card`: left 16px, bottom 124px, width min(330px, 100vw-32px), `surface-glass`, `line`, radius 16px, `shadow-panel`; `pointer-events:none` unless `.den-cursor-free`). Phone breakpoint is max-width 599px. Walk mode adds `.den-visiting` to the shell; the cursor is captured while walking and freed with `.den-cursor-free`. `App.jsx` mounts `<ProximityCard card={nearby}/>` only while `exploring`.
- Live store: `apps/ui/src/state/live-store.mjs` (`onChange` -> `applyEvent`, which returns null for unknown or out-of-sequence frames and triggers a refetch). The ring buffer is a new field next to `snapshot`, fed from `onChange` before `applyEvent`, keyed by the agent id the event carries. The SSE shape for agent transcript events comes from organism-infra/106 (not landed): build on a fixture and keep the event-to-entry mapping in one pure function so 106 only changes that function.
- Design system (artifact HBXgYhAzu6YmekpW71WM7j): tokens `surface-glass`, `surface-300`, `line`, `ink`, `ink-muted`, `qi`, `lantern`, `alarm`, `focus-ring`, `radius-s/m/l`, `space-1..7`, `shadow-panel`, `dur-fast`, `dur-base`, `ease-soft`. Type: `sans` for UI, `mono` for tool input/output (`code`, `code-small`). Display font is NOT for this panel. No emoji; icons are line glyphs. `lantern` only means "waiting on you", `alarm` only failure.

## Draft UI spec

### Layout
- Panel `Transcript` fixed to the right edge of the scene (`right:16px; top:88px; bottom:124px`), `width:min(420px, calc(100vw - 32px))`, `surface-glass`, 1px `line`, `radius-l`, `shadow-panel`, `z-index:5`. The card stays on the left.
- Header (`space-3` padding, bottom border `line`): overline `Transcript`, heading = card name (`heading`), `code-small` agent id, state word + icon (same glyph/word rule as StatusChip, never hue alone), Close button (line X icon, 44px target), `aria-label="Close transcript"`.
- Body: scrollable list, newest at the bottom, `space-2` between entries.
- Footer strip, only when scrolled up: `Jump to latest (n)`.
- Phone (<600px): bottom sheet (`left/right:16px; bottom:116px; max-height:55dvh`), like `.panda-detail`; the card hides while it is open (the header repeats name and state).

ASCII sketch (desktop):
```
+-----------------------------------------+   +-------------------------+
|                 scene                    |   | TRANSCRIPT          [x] |
|                                          |   | dev-02  developer       |
| +---------------------+                  |   | (brush) Working         |
| | Steamers - developer|                  |   |-------------------------|
| | dev-02   Working    |                  |   | Agent  14:02            |
| | den-v1/05           |                  |   | I'll start with the     |
| | Edit - live-store   |                  |   | failing test.           |
| | [T][F][A][D]        |                  |   | > Read  live-store.mjs  |
| +---------------------+                  |   | v Edit  live-store.mjs  |
|                                          |   |   input: {...} (mono)   |
|                                          |   |   result: ok            |
|                                          |   | You    14:03            |
|                                          |   | Use a cap of 200.       |
|                                          |   |   [Jump to latest (2)]  |
+-----------------------------------------+   +-------------------------+
```

### Entries
- Message: speaker (`Agent` / `You`, `small`, `ink-muted`) + time + text (`body`, `ink`, `overflow-wrap:anywhere`, line breaks kept). User messages on a `surface-300` bubble.
- Tool call: one row, collapsed by default: chevron (line glyph), tool name (`code-small`), one-line summary (`small`, `ink-muted`, ellipsis), status word at right (`running`, `ok`, `failed`; `failed` is `alarm` text plus the word). A `<button aria-expanded>` toggles it. Expanded: input and result in `surface-300` wells, `code` mono, `max-height:240px; overflow:auto`; results over 4 KB show the first 4 KB plus "Truncated, N more bytes".
- Pending permission request: tool name + "Waiting on you" with the lantern word and icon. No buttons here (A/D is ticket 06).
- Collapse state is per entry, kept while the panel is open, reset on close.

### Behaviour
- Open: F while a card shows with `actions.F.enabled`; also the card's F button when the cursor is free. Closing returns focus to the scene (walk) or the card's F button (cursor free).
- Close: Esc, F again, or Close. While the panel is open, Esc is consumed by the panel first; a second Esc leaves walk mode.
- Pinned to the agent id, not the card: walking away leaves it open (Open question 3).
- Streaming: new events append in order. Within 24px of the bottom it auto-scrolls; otherwise it stays put and `Jump to latest (n)` appears. Appending never steals focus. List is `role="log"` with `aria-live="off"`; the footer count is `aria-live="polite"`.
- Ring buffer: per agent, cap 200 (`TRANSCRIPT_CAP`), drops oldest first; when something was dropped the first row reads `Earlier entries were dropped`. Survives panel close; not persisted across reload.
- Keyboard: Tab order Close, tool rows, Jump to latest. Enter or Space toggles a row. Panel is `role="complementary"`, `aria-label="Transcript for <name>"`.
- Token (story 23): F is read-only on the already-open SSE stream, no new route, so it needs and sends no token. Add the criterion at qa specify: "opening, streaming and closing the transcript issues no network request".

### States
| State | What shows |
|---|---|
| Open, entries present | The list |
| Open, no entries yet | Centered `small` text `Waiting for the agent's first message.` |
| Connecting / reconnecting | Banner under header `Reconnecting...`; existing entries stay |
| Offline | Banner `Bridge offline: run npm run ui`; entries stay readable |
| Error (malformed event) | Row `Unreadable event` (`small`, `ink-muted`) with its type; never throws or blanks the panel |
| Agent ended (done, failed, terminated) | Header state updates; final line `Agent ended: <state>` (failed adds `alarm` word and icon); panel stays open, buffer kept |
| F on a card with no agent | Nothing opens. The card's F stays disabled with its reason visible (`no agent running`, already shipped). Pressing the F key also repeats the reason once in a polite live region |
| F, agent with zero buffered events | Opens the empty state |
| Demo mode (den-v1/09) | Opens against fixture events |
| Reduced motion | No open/close animation, no smooth scroll; instant show/hide, auto-scroll jumps |
| Motion allowed | Fade in over `dur-base` with `ease-soft` plus 8px slide from the right; chevron rotates over `dur-fast`; nothing else animates |
| Light and dark | Tokens only; text 4.5:1 on `surface-glass` and `surface-300` in both themes; icons and focus ring 3:1 |

### Copy
`Transcript` / `Close transcript` / `Jump to latest (3)` / `Earlier entries were dropped` / `Waiting for the agent's first message.` / `Agent ended: done` / `Unreadable event` / `Reconnecting...` / `Bridge offline: run npm run ui` / row titles `Show details`, `Hide details`. Sentence case, present tense, no emoji.

### Accessibility
WCAG 2.1 AA. 2px `focus-ring` at 2px offset on every control. 44px touch targets on phone. No hue-only meaning. Opening the panel releases pointer lock so the cursor is free; walk-mode key handling must not swallow Tab/Enter/Space while focus is inside the panel; `Look around` recaptures.

### Criteria mapping (for qa specify)
1. Buffer: append per agent, order kept, drops oldest beyond cap, no cross-agent leakage, malformed event does not throw (pure module).
2. Panel shows new events while open: pure `transcriptView(buffer, uiState)` -> entries, collapsed flags, `atBottom`, `unread`, dropped-notice flag.
3. F with no agent: `cardFor` already gives `actions.F.enabled === false` plus a reason; test the F handler does not open and the reason is exposed.
4. Story 23 criterion above.
5. `npm test` green.

## Open questions for the user (ask with AskUserQuestion)
1. Side panel at right (drafted) or a larger centered modal with the scene dimmed?
2. Buffer cap 200 per agent: right size? (200 is a guess.)
3. Panel pinned to the agent when you walk away, or close when the card goes away?
4. Tool results collapsed by default (drafted) or one-line result shown inline?
5. Is `Jump to latest` enough, or a pause-streaming toggle?
6. Open from the diorama too? Drafted: walk mode only, per the ticket.

## Mockup
Only the ASCII sketch exists. An HTML/SVG static mockup (light and dark, desktop and phone) is still to make and needs the user's mark-up before sign-off.
