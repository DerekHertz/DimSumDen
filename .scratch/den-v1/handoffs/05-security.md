# Handoff: den-v1/05 security review

```json
{
  "ticket": "den-v1/05-transcript-f",
  "cell": "security",
  "current_step": "Security pass at 5c3267f. No critical or high findings. One low finding noted.",
  "artifacts": [],
  "decisions": [
    "Pass: all transcript text renders as React text nodes; no dangerouslySetInnerHTML, innerHTML, eval, fetch, EventSource, child_process or href in the new files.",
    "Pass: no dependency, lockfile, or .github change; gitleaks over origin/main..5c3267f found no leaks."
  ],
  "failures": [],
  "pending": []
}
```

## Scope reviewed
Diff 75d4877~1..5c3267f under apps/ (TranscriptPanel.jsx, transcript-view.mjs, transcript-panel.mjs, transcript-buffer.mjs, live-store.mjs, App.jsx, ProximityCard.jsx, explorer.mjs, den.css).

## Findings
- apps/ui/src/state/transcript-buffer.mjs:8 (low): `buffers[agentId]` reads the prototype chain, so an agentId of `constructor` or `__proto__` makes `appendTranscript` throw inside the SSE onChange handler (verified). agentIds are bridge-generated and no transcript frames exist until organism-infra/106, so it is not reachable today. Fix with `Object.hasOwn(buffers, agentId)` or a Map when 106 lands.
- apps/ui/src/overlay/transcript-view.mjs:34 (low): `entry.status` flows unvalidated into a CSS class name (`transcript-status-${status}`). Class text only, no injection.
- Tool results are clipped at 4096 bytes and the buffer is capped at 200 per agent, so a hostile stream cannot grow the DOM unbounded.
- Info: the document-level capture keydown handler skips input/textarea targets except for Escape; it only acts in walk mode.
