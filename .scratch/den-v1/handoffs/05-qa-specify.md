```json
{
  "ticket": "den-v1/05-transcript-f",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed on tests/05-transcript-f (75d4877). All 5 files fail with ERR_MODULE_NOT_FOUND for the modules the developer must create (missing feature, no syntax or setup errors).",
  "artifacts": [
    "apps/ui/src/state/transcript-buffer.test.mjs",
    "apps/ui/src/state/live-store-transcript.test.mjs",
    "apps/ui/src/overlay/transcript-view.test.mjs",
    "apps/ui/src/overlay/transcript-panel.test.mjs",
    "apps/ui/src/overlay/transcript-wiring.test.mjs"
  ],
  "decisions": [
    "SSE frame shape is not defined anywhere (organism-infra/106 not landed), so qa pinned a fixture shape: { seq, type: 'transcript', agentId, entry }. entryFromFrame in transcript-buffer.mjs is the only place it lives, so 106 changes one function.",
    "Transcript frames sit in the normal seq sequence: applyEvent already passes unknown types through (seq advances), so no refetch.",
    "Tool status updates (running -> ok) are NOT specified: the buffer is append-only and the view takes a tool entry with its status. How a tool-end merges into its tool-start is the developer's call (the existing CellEvent has separate tool-start/tool-end); add a test if you pick merge-by-id."
  ],
  "failures": [],
  "pending": [
    { "item": "Create transcript-buffer.mjs, transcript-view.mjs, transcript-panel.mjs, the store field, TranscriptPanel.jsx, App wiring, CSS; make the 5 test files pass without editing them", "owner": "developer" }
  ]
}
```

## Contracts (each is also in the header of its test file)

- `apps/ui/src/state/transcript-buffer.mjs`: `TRANSCRIPT_CAP = 200`; `appendTranscript(buffers, agentId, entry, cap)` returns a new `{[id]: {entries, dropped}}`, entries get `n` (1-based arrival number); `entryFromFrame(frame)` returns `{agentId, entry}` or null, malformed entries become `{kind:'unreadable', type}`.
- `live-store.mjs`: `getState().transcripts`, fed in `onChange` for transcript frames; survives snapshots and errors.
- `apps/ui/src/overlay/transcript-view.mjs`: `transcriptView(buffer, {expanded, atBottom, seenThrough, connection})` returns `{empty, emptyText, droppedNotice, droppedText, rows, atBottom, unread, jumpLabel, banner}`; row shapes in the test header.
- `apps/ui/src/overlay/transcript-panel.mjs`: `initialTranscriptState`, `transcriptKey(state, {key, card, mode})` returns `{state, handled}`, `transcriptToggle`, `closeTranscript`.
- `<TranscriptPanel` mounted in `App.jsx`; `ProximityCard.jsx` drops "Transcript coming next".

## Criterion to test map

| Criterion | Test |
|---|---|
| 1 Events append per agent, oldest dropped beyond cap | transcript-buffer.test.mjs (append, order, per-agent, cap 200, custom cap, immutability, entryFromFrame); live-store-transcript.test.mjs (per-agent via SSE frames, cap, malformed, survives reconnect) |
| 2 Panel shows new events while open | transcript-view.test.mjs (rows in arrival order, unread/jump pill, banner, empty, dropped notice, row kinds); live-store-transcript.test.mjs (state object changes and subscribers notified per frame) |
| 3 F with no agent does nothing, reason visible | transcript-panel.test.mjs 'F on a card with no agent' (resident, ended agent, click, no card); notice equals card.actions.F.reason |
| Story 23 no network request | transcript-wiring.test.mjs (fetch stub plus fetchState counter across open, stream, close; source scan for network primitives) |
| User answers Q3 pinned, Q6 walk only | transcript-panel.test.mjs 'pinned to the agent, walk mode only' |
| Esc consumed first, second Esc leaves walk | transcript-panel.test.mjs (handled flag) |
| Wiring and copy | transcript-wiring.test.mjs (App mounts panel, roles, labels, copy strings, reduced-motion CSS present) |
| 4 `npm test` green | developer and verify run it; the existing proximity-card.browser test must stay green (resident card still shows 4 disabled buttons) |

## human-verified (the user critiques the UI)

Right-side panel layout and 420px width, phone bottom sheet under 600px with card hidden, 32px/44px Close targets, Jump pill at bottom centre, light and dark contrast, focus rings, fade/slide and chevron motion, reduced-motion behaviour (only CSS presence is tested), auto-scroll within 24px of the bottom, focus return on close, `aria-live` regions behaving, pointer lock release on open, and live stream against organism-infra/106 when it lands.

## Notes for the developer

- Do not edit the five test files. Anything that seems wrong in a contract: ask the orchestrator, do not loosen the test.
- Not tested, left to the developer and the user's critique: agent-ended line being appended (an `ended` entry kind exists in the view; who emits it is open), per-entry collapse reset on close (UI state, not pure).
