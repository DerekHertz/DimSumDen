# 12: Close the transcript panel's test gaps and prototype-key bug

**Type:** chore

**Priority:** P3

**Blocked by:** den-v1/05 (merged)

**Status:** ready-for-agent

**Serves:** keeps den-v1/05's story 23 and Esc criteria under automated test.

## What to build

qa verify on den-v1/05 (handoff `05-qa-verify.md`) found two gaps. Neither blocked the merge.

1. The story 23 "no network request" source scan in `apps/ui/src/overlay/transcript-wiring.test.mjs` (about line 14) skips `apps/ui/src/overlay/TranscriptPanel.jsx`, which is where the panel opens. Add that file to the scan.
2. The Esc test in `apps/ui/src/overlay/transcript-panel.test.mjs` (about lines 50 to 54) checks only the handled flag. Nothing tests the App capture listener that acts on it (`TranscriptPanel.jsx`, about lines 39 to 47). Add a test showing that Esc closes the panel and doesn't also act as the walk-mode Esc.

3. security on den-v1/05 (low): `buffers[agentId]` in `apps/ui/src/state/transcript-buffer.mjs` (about line 8) reads the prototype chain, so an agentId of `constructor` or `__proto__` makes `appendTranscript` throw. It can't happen today, because agentIds come from the bridge. Fix it with `Object.hasOwn` or a `Map` before organism-infra/106 sends transcript frames.

## Acceptance criteria

- [ ] The story 23 scan covers `TranscriptPanel.jsx` and fails if a network call is added there.
- [ ] A test covers the Esc capture listener: Esc closes the panel, and the event goes no further.
- [ ] An agentId of `__proto__` or `constructor` appends safely, and a test shows it.
- [ ] `npm test` is green.

## Comments
