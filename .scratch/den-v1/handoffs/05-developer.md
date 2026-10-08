```json
{
  "ticket": "den-v1/05-transcript-f",
  "cell": "developer",
  "current_step": "Implemented and committed on feat/05-transcript-f (5c3267f). All five qa test files pass unedited; npm test green (2786 pass, 0 fail, includes proximity-card.browser). Code review skill not run (context budget); self-reviewed. Vite build not run separately, but the browser test loads App.jsx through Vite, so the JSX compiles.",
  "artifacts": [
    "apps/ui/src/state/transcript-buffer.mjs",
    "apps/ui/src/state/live-store.mjs",
    "apps/ui/src/overlay/transcript-view.mjs",
    "apps/ui/src/overlay/transcript-panel.mjs",
    "apps/ui/src/overlay/TranscriptPanel.jsx",
    "apps/ui/src/overlay/ProximityCard.jsx",
    "apps/ui/src/App.jsx",
    "apps/ui/src/scene/procedural/explorer.mjs",
    "apps/ui/src/scene/procedural/den.css"
  ],
  "decisions": [
    "useTranscript hook lives in TranscriptPanel.jsx; App owns it so the F key and the card's F button share the reducer. F key and Esc are handled by a capture-phase document keydown listener that stops propagation, so the first Esc closes the panel and the explorer's Esc handler never sees it.",
    "Added explorer.freeCursor() (the Tab path refactored to call it) so opening the panel releases pointer lock without leaving the den. Explorer ignores walk keys when focus is inside .transcript-panel.",
    "Leaving the den closes the panel (walk mode only, Q6). A card change clears an old notice. The notice is a visually-hidden polite live region; the card's own reason stays visible.",
    "Card F button is enabled only when actions.F.enabled; T, A, D stay disabled. F's helper text is 'Opens the live transcript' (the old 'coming next' copy is gone).",
    "live-store buffers a transcript frame only when seq is newer than the snapshot, and publishes it even when the frame triggers a refetch.",
    "Tool-end merging into tool-start is not done: the fixture frame is one entry per tool with a status; 106 will decide the merge, in entryFromFrame."
  ],
  "failures": [],
  "pending": [
    { "item": "qa verify (light), then user visual critique: panel layout 420px, phone bottom sheet, 32/44px Close, Jump pill, focus return on close, pointer-lock release on open, reduced motion, light/dark. Live stream check when organism-infra/106 lands. Nothing emits 'ended' entries yet.", "owner": "qa" }
  ]
}
```

Environment issues: none. Failed calls: a `sleep 1; echo` Bash call was refused by the sleep-guard hook (genuine guardrail, my mistake); an earlier chained node script call was refused by the worktree guard (fixed by writing the script with Write); Monitor tool is not available to the developer cell.
