# den-v1/03 designer review (batch D1, PR #151 at 0604c76): Design pass

```json
{
  "ticket": "den-v1/03-walk-mode",
  "cell": "designer",
  "mode": "review",
  "current_step": "Design review of walk mode and the exponential wheel zoom at 0604c76. Built and ran the UI on the fixture bridge in headless Chromium (software GL, real draws): page loads, console has 0 errors. Pass: walk mode works end to end and the exponential zoom feels right in Chromium. Three non-blocking findings (one real: wheel deltaMode).",
  "artifacts": [
    "codex/procedural-den-frontend@0604c76",
    "apps/ui/src/scene/procedural/camera.mjs:18",
    "apps/ui/src/scene/procedural/CameraRig.jsx:74",
    "apps/ui/src/scene/procedural/explorer.mjs",
    "apps/ui/src/App.jsx:101",
    "scratchpad shots: d-light.png, walk-dark-start.png, walk-dark-moved.png, walk-after-esc.png, m-walk.png"
  ],
  "decisions": [
    "Exponential wheel zoom, feel confirmed (Chromium). One mouse notch (deltaY -100) scales by exp(-0.1) = 0.905, a steady 10% per notch. Default (1.0) to nearest (0.55) takes 6 notches (measured: chip positions stop moving on notch 6); the full 1.2 to 0.55 range is about 8. Equal travel gives equal ratios, no lurch near either end, the rig eases the move. Trackpad small deltas scale smoothly. Keep it.",
    "Walk mode, pass. Click Enter the den: camera drops to eye height at the frozen start (0, 8.95), button becomes Leave the den with pressed state, hint reads 'WASD / arrows to walk, mouse to look, Shift to go faster, Esc to leave', crosshair shows, pointer lock engages. W for 3 s moved the view forward to the table; mouse look turned it. Esc returned the diorama to exactly the previous frame (walk-after-esc.png vs d-dark: same layout). Keyboard path works too: focus the button, press Enter, then W moves (focus moves to main, so the keydown guard on button targets does not swallow WASD). Reduced motion: walk bob is switched off (walk.mjs, reducedMotion input) and the rig skips easing (CameraRig.jsx:109).",
    "Light and dark both read: walk view in dark has the dark-green grove, chips and hint keep contrast (hint on surface-glass, chips from tokens).",
    "Mobile 375x667 (m-walk.png): on-screen pad (48 px buttons, 4 arrows) appears, Leave the den is the exit, nothing overlaps the intent bar. Drag-to-look is the fallback look control.",
    "Not reviewed: PandaCard.jsx (den-v1/04 parked, per brief). Herald has no resident panda (user decision)."
  ],
  "failures": [],
  "pending": [
    {"item": "F1 (medium, follow-up, not a bounce): wheel zoom ignores event.deltaMode. CameraRig.jsx:74 passes e.deltaY straight to wheelZoom (camera.mjs:18). Firefox mouse wheels report deltaMode 1 with deltaY of about 3 per notch: measured a dispatched WheelEvent(deltaY -3, deltaMode 1) moves the chips 1 px, so wheel zoom is effectively dead in Firefox. Fix: scale deltaY by 33 when deltaMode is 1 and by the viewport height when 2, before wheelZoom. Also the clamp at camera.mjs:18 limits the exponent to +/-20, not the delta; clamp the exponent to about +/-1 so one hard flick cannot jump the whole range in a single event (clamping at 0.55 and 1.2 already bounds the result, so this is hygiene).", "owner": "developer"},
    {"item": "F2 (low): after Esc or Leave the den the focus lands on main, not on the Enter the den button it came from. Return focus to the .den-entry button on exit (App.jsx:101 / explorer exit) so a keyboard user does not lose their place in the tab order.", "owner": "developer"},
    {"item": "F3 (low): on touch the hint still says 'WASD / arrows ... mouse to look ... Esc to leave' (explorer.mjs fallback hint, m-walk.png). A phone has the pad and the Leave the den button instead. Show touch copy when matchMedia('(pointer:coarse)') matches, for example 'Hold the arrows to walk, drag to look, tap Leave the den to go back'. Also there is no global Enter key shortcut: the ticket text says 'control and key'; today the key is Enter or Space on the focused button. Acceptable, but say so in the ticket or add a shortcut.", "owner": "developer"},
    {"item": "Design system upkeep: add the walk-mode controls (Enter/Leave the den button, hint, crosshair, touch pad) and the exponential wheel rule to the design system artifact and docs/design/2026-10-01-iso-den.md section on Zoom (the doc already has the wheel rule). Needs user approval before publish. Note den-map.md still says pandas never roam open grass; the procedural den has roaming pandas by user decision, so den-map.md is stale.", "owner": "designer"}
  ]
}
```

Unchecked: the 3D walk collision feel at stalls (covered by walk.test.mjs, not exercised by eye); light-theme walk screenshot (dark and light diorama checked, walk checked in dark and light-reduced-motion by state only); zoom frames Level 1 to 4 comparison beyond Level 1 default frame (d-light matches level1-den-iso.png composition: Bao centre, four stalls, Needs you card top right).
