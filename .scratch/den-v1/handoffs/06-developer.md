```json
{
  "ticket": "den-v1/06-approve-deny",
  "cell": "developer",
  "current_step": "Partial: bridge client, review controller and pendingLine done and green; ApprovalPanel.jsx written; wiring (ProximityCard, App, TranscriptPanel blocked flag, explorer selector, CSS) NOT done.",
  "artifacts": [
    "apps/ui/src/state/bridge-client.mjs",
    "apps/ui/src/overlay/approval-review.mjs",
    "apps/ui/src/overlay/ApprovalPanel.jsx",
    "apps/ui/src/overlay/proximity-card.mjs"
  ],
  "decisions": [
    "bridge-client.test.mjs and approval-review.test.mjs pass in full (73 pass). approval-wiring.test.mjs: pendingLine tests, no-network tests pass; the 4 wiring tests fail only because App/ProximityCard/CSS are not edited yet.",
    "Do not use Write or heredocs with backslash-u sequences: the Write tool turned them into raw characters (including U+2028) and broke a regex literal. The bidi/control escaping now uses a code-point range table (UNSAFE_RANGES) instead of a regex.",
    "useApprovalReview in ApprovalPanel.jsx takes { client, card, exploring, cursorFree, demo, snapshot, onOpen } and returns { review, state, openFrom }. It owns the capture-phase keydown listener, snapshot sync, 1s tick and close-on-leaving-den."
  ],
  "failures": [],
  "pending": [
    { "item": "ProximityCard.jsx: import pendingLine; replace the 'Permission request waiting' line with lantern icon + pendingLine(card); props onAnswer and demo; A and D buttons enabled when card.actions[key].enabled and not demo (T stays disabled), onClick -> onAnswer(card); reason text 'Demo mode: actions are off' in demo; change NEXT text for A/D. Keep the browser test green (resident card still shows 4 disabled buttons).", "owner": "developer" },
    { "item": "App.jsx: add `<ApprovalPanel review={approval.review} state={approval.state} />` (before TranscriptPanel), `const bridge = useMemo(() => createBridgeClient({ fetch: steering.session.fetch }), [steering.session])`, `const approval = useApprovalReview({ client: bridge, card: nearby, exploring, cursorFree, demo, snapshot, onOpen })` where onOpen closes the transcript (via a ref to transcript.close) and calls releaseCursor; pass onAnswer={approval.openFrom}, demo, and an F handler that no-ops while the review is open to ProximityCard.", "owner": "developer" },
    { "item": "TranscriptPanel.jsx useTranscript: add a `blocked` option (ignore its keydown handler while the review is open). explorer.mjs: add `.approval-panel` to the closest(...) ignore selector next to `.transcript-panel`.", "owner": "developer" },
    { "item": "den.css: add .approval-* styles per the ticket spec (panel in the transcript slot, header, well, note, footer buttons, banner with alarm tokens, spinner, phone sheet under 600px hiding the card, prefers-reduced-motion with no animation). Model it on the .transcript-panel block.", "owner": "developer" },
    { "item": "Run npm test (all green), /code-review, then commit and release at in-review.", "owner": "developer" }
  ]
}
```

Stopped at the context limit (outcome: partial). Branch feat/06-approve-deny has a WIP commit plus a second commit with ApprovalPanel.jsx. A fresh developer cell should continue on the same branch.
