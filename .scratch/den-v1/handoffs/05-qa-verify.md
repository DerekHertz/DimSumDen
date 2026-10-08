# den-v1/05-transcript-f: QA full verify

Verdict: **QA pass** (full verify). I did not write these tests. The specify commit 75d4877 came from another qa session, so light verify does not apply.

```json
{
  "ticket": "den-v1/05-transcript-f",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Full verify of feat/05-transcript-f at 5c3267f: QA pass. Ticket stays in-review for the user's visual critique (ready-for-human).",
  "artifacts": [
    "apps/ui/src/state/transcript-buffer.test.mjs",
    "apps/ui/src/state/live-store-transcript.test.mjs",
    "apps/ui/src/overlay/transcript-view.test.mjs",
    "apps/ui/src/overlay/transcript-panel.test.mjs",
    "apps/ui/src/overlay/transcript-wiring.test.mjs"
  ],
  "decisions": [
    "Suite result taken from /tmp/05-tests.txt (developer's npm test run), per the orchestrator's instruction. Not re-run by qa.",
    "Test files unchanged since specify: git diff 75d4877 HEAD over the five files is empty.",
    "Findings are non-blocking test-strength gaps (below). They do not fail any criterion on this branch."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Decide whether findings 1 and 2 go into a follow-up test; then the user's visual critique and the live stream check (organism-infra/106).",
      "owner": "orchestrator"
    }
  ]
}
```

## Suite (saved run, /tmp/05-tests.txt)

- 2786 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo, 93 suites.
- The proximity-card browser test is in the output and passes (resident card keeps its disabled actions).
- All 76 named test blocks in the five specify files appear as `ok` in the output. No `not ok` lines.

## Specify tests unchanged

`git diff 75d4877 HEAD` over the five test files is empty. `git diff --stat 75d4877 HEAD` lists nine source files and no test files.

## Criterion to test map

| Criterion | Test |
|---|---|
| 1 Events append per agent; oldest dropped beyond cap | transcript-buffer.test.mjs: per-agent buffers, cap 200, drops oldest, custom cap, input never mutated. live-store-transcript.test.mjs: frames land in the right agent's buffer, cap holds through the store, buffers survive reconnect. |
| 2 Panel shows new events while open | transcript-view.test.mjs: "new events show as new rows in arrival order, newest last"; unread count and Jump pill when scrolled up. live-store-transcript.test.mjs: subscribers get a new state per frame. |
| 3 F with no agent does nothing; reason visible | transcript-panel.test.mjs: "F on a card with no agent does nothing and the reason stays visible" (resident, ended agent, clicked disabled F, no card). |
| 4 `npm test` green | Saved run: 2786 pass, 0 fail, 0 skipped. |
| Story 23: open, stream and close make no network request | transcript-wiring.test.mjs: fetch stub and state-fetch counter across open, stream and close; source scan of three modules. |
| Esc and F again close it | transcript-panel.test.mjs: "opening and closing". |
| Q3 pinned to its agent; Q6 walk mode only | transcript-panel.test.mjs: "pinned to the agent, walk mode only". |
| Tool calls collapsed by default; Show or Hide details | transcript-view.test.mjs: tool-row tests. |
| Jump to latest (n), no pause toggle | transcript-view.test.mjs: "scrolled up, new events count as unread" and the across-drops case. |
| Copy, roles, reduced-motion CSS present | transcript-wiring.test.mjs: "wiring" block (string presence only). |

Human-verified (user critique, not automated): panel layout and 420px width, phone bottom sheet under 600px, 32px and 44px Close targets, Jump pill placement, light and dark contrast, focus rings, motion, reduced motion behaviour, focus return on close, pointer-lock release on open, live-stream behaviour once organism-infra/106 lands.

## Findings (non-blocking, file:line)

1. `apps/ui/src/overlay/transcript-wiring.test.mjs:14` and `:17-47`: the story 23 source scan covers three pure modules and omits `TranscriptPanel.jsx`, where `useTranscript` opens the panel. The fetch stub also exercises only the reducer and the store, not the hook. I read `TranscriptPanel.jsx`, the App and ProximityCard diffs, and the explorer diff: none call fetch, EventSource, or WebSocket, so the criterion holds on this branch. A future regression in the component would pass the test.
2. `apps/ui/src/overlay/transcript-panel.test.mjs:50-54`: "the first Esc does not leave walk mode" asserts only `handled === true`. The capture listener that honours `handled` (`apps/ui/src/overlay/TranscriptPanel.jsx:39-47`) has no automated test, so a regression there would pass.
3. `apps/ui/src/overlay/TranscriptPanel.jsx:115-122`: the `useLayoutEffect` deps use `lastN.current`, a ref read during render. It works here because the ref is set before the deps array is read, but it is fragile. Code-quality note only.

## Scope: files touched outside the ticket's named list (listed, not judged)

- `apps/ui/src/App.jsx`: mounts the panel and wires F and Esc.
- `apps/ui/src/overlay/ProximityCard.jsx`: F button enabled only when `actions.F.enabled`; copy changed.
- `apps/ui/src/scene/procedural/explorer.mjs`: adds `freeCursor()`, refactors the Tab path to call it, and skips walk keys inside `.transcript-panel`.
- `apps/ui/src/scene/procedural/den.css`: transcript panel styles.

No package.json, bridge, ADR, or `.claude/` changes in the diff.
