# den-scene-v1/07 developer: WIP, UI built, old tests not migrated

Branch `feat/floating-cards07`, WIP commit 1105e00 (on top of qa's f7f413a). Stopped early on the 90% usage wrap-up.

```json
{
  "ticket": "den-scene-v1/07-sidebar-overlays",
  "cell": "developer",
  "current_step": "UI implemented and committed as WIP; 22 of qa's 25 tests seen passing; old tests not migrated; npm test and smoke:ui not run",
  "artifacts": [
    "branch feat/floating-cards07 (1105e00)",
    "apps/ui/src/overlay/Cards.jsx",
    "apps/ui/src/overlay/Bottom.jsx",
    "apps/ui/src/overlay/overlay-model.mjs",
    "apps/ui/src/scene/camera-store.mjs"
  ],
  "decisions": [
    "One camera store (zoom + look-at target) is the single source: CameraRig eases toward it; wheel, pinch, +/- keys, Zoom in/out, level buttons and station pills all write it; the zoom nav's data-zoom reads it",
    "Level zooms: 1 = 1, 2 = 0.75, 3 = 0.55; Level 4 Workspace is aria-disabled (no destination yet)",
    "ApprovalCard keys kept as qa read them: a approve, d deny, m focus Note, j/k next/previous waiting request (wrap). ASSUMPTION for the designer to confirm",
    "Send is aria-disabled and the autonomy chip is a local preference: the bridge has no intent endpoint (ADR 0016 slices). The Current intent pill reads 'none set'. Timeline track is decorative (dots come from tickets taken in the last hour); dragging does nothing yet",
    "Eyebrow (Station · role · ticket) is not uppercased: qa's test matches mixed case and innerText applies text-transform",
    "ChipLayer: the Tally pill's aria-controls is set only while the card is open (a dangling aria-controls failed the axe stand-in)",
    "Removed UsageMeter, Queue, Gates from Panel.jsx and the sidebar CSS; Detail/Markdown left in Panel.jsx unmounted (selected-panda card ticket may reuse). usage-meter-model stays (Tally)",
    "Camera width: the canvas is now the full viewport (.scene absolute, inset 0, .shell min-width removed), so CameraRig reads the full width with no sidebar subtraction; --scene-bottom-inset is 104px so the Tally card clears the intent bar"
  ],
  "failures": [
    "qa test 24 (keyboard tab order) cannot pass as written: after header(stations).click() Chromium keeps the Tab starting point at the Stations header, so the walk starts there and sees stations, zoom, intent before needs-you. With the start point reset (focus main first) the same test passes fully, including the 2px ring checks. Proven with a throwaway copy (deleted). Needs a qa fix, not an app change",
    "qa test 18 (+/- clamp, 80 clicks) times out in this environment (49 s alone, empty TimeoutError, likely software-GL frame starvation; tally tests use lightenScene). Not diagnosed; the buttons work in tests 16, 17",
    "Tests 13 and 14 timed out in the full run but passed alone (load)"
  ],
  "pending": [
    {
      "item": "qa: fix the tab-start in test 24 (e.g. focus main.scene before the Tab loop) and consider lightenScene(context) in openApp for test 18",
      "owner": "qa"
    },
    {
      "item": "Diagnose test 18 (run alone with a larger click timeout or lightenScene to see whether the app or the harness is slow)",
      "owner": "developer"
    },
    {
      "item": "Migrate old tests: tally-card-wiring.test.mjs ('usage slot still wired' now inverted: meter lives on the Tally), tally-expand.test.mjs (scrollState reads .panel; line ~254 aside meter; last test reads aside h2), brand.test.mjs (h1 now in overlay/Cards.jsx; display-font selector .panel-header h1 is now .logo-pill h1), apps/ci-cd/smoke-ui.mjs (waits on [data-slot=queue] .qrow and .gate-card; the 375x667 style hack for .shell/.panel is no longer needed), camera-rig tests unchanged and green",
      "owner": "developer"
    },
    {
      "item": "Run npm test and npm run smoke:ui (with timeouts); add unit tests for camera-store (clamp, level, station) and overlay-model; then /code-review, then final commit",
      "owner": "developer"
    },
    {
      "item": "Designer review: desktop and phone, light and dark; confirm keys m/j/k, 16px vs 18px station dot, eyebrow case, Level 2/3 zoom values",
      "owner": "designer"
    }
  ]
}
```

## qa's 25 tests, last observed

Pass (22, each seen green in the full run or alone): 1 to 4, 5 (after the count-pill space fix, rerun alone), 6 to 12, 13 and 14 (alone), 15, 16, 17, 19 (wheel + clamp), 20 (pinch), 21 to 23 (phone), 25 (after the aria-controls fix, run alone: it was the failing one then; not rerun green after the ChipLayer edit, so treat as unconfirmed).

Fail or unconfirmed: 18 (timeout), 24 (test wrong, see failures), 25 (fix applied, not re-run).

## Old tests that will break (not yet migrated)

See the pending list. Nothing was deleted or weakened; qa's test file is untouched.
