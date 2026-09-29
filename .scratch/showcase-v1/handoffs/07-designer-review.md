# 07 tally-stele: designer review

Verdict: **Design bounce**. The stele itself passes: placement, geometry, name and keyboard route all match the revised spec. There is one medium finding (the pill sits in the wrong place) and one low finding (face text contrast).

```json
{
  "ticket": "showcase-v1/07-tally-stele",
  "cell": "designer",
  "mode": "review",
  "current_step": "review done; design system published (v14)",
  "artifacts": [
    "https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j (tokens stone, stone-deep; components/Stele)",
    "apps/ui/src/scene/TallyFace.jsx",
    "apps/ui/src/scene/ChipLayer.jsx",
    "apps/ui/src/scene/banquet-layout.mjs"
  ],
  "decisions": [
    "The pill not sitting over the stele is a finding: the spec pins it directly above the tablet top",
    "Put face text on stone-deep so qi text reaches AA; the tablet mesh stays stone"
  ],
  "failures": ["No browser pane in cloud, so the pill cause is unconfirmed"],
  "pending": [
    {"item": "Fix the pill so it projects over the stele in the running app", "owner": "developer"},
    {"item": "Fill the face canvas with stone-deep #3d403d", "owner": "developer"},
    {"item": "Browser re-check of the pill position", "owner": "user"}
  ]
}
```

## Findings

1. **Medium: the pill is detached from the stele.** In the user's 0dba375 browser check, the "Tally" pill shows high and to the left, near the table edge. The code anchors it correctly: `TallyFace.jsx:110` sets (1.5, 1.8, 3.4). At the default camera (0, 4.2, 11.5, pitch -0.2, fov 38, 1280x800), that point projects to (847, 503), about 30px above the tablet top at (846, 536). The observed spot is close to the table's right rim at (1.3, 0.7, 0), which projects to (766, 511). So the bug is at runtime. `stackChips` moves chips only on y, so it can't cause the x shift. Cause (guess): the pill is projected against a stale or different camera or size, or the chip layer's box is offset from the canvas. Fix target: in the browser, the pill's centre x is within 10px of the stele's centre x, and the pill sits 0 to 40px above the tablet top, at the default camera and after a pan.
2. **Low: face text contrast.** `TallyFace.jsx:34` fills the face with #4a4d4a. qi #3aced3 on it measures 4.47:1, just under 4.5 for the 12 to 17px labels. It's decorative, and the Dashboard carries the same data, but the fix is cheap: fill the face with `stone-deep` #3d403d, which gives 5.48:1.

## Passes

- Placement at x 1.5, z 3.4, groundY 0, yaw -0.183; plinth 1.1x0.25x0.4; tablet 0.9x1.3x0.14 (`banquet-layout.mjs:16`).
- No roof or posts. Charts glow in qi; "Spills" is kept.
- Accessible name "Tally: open the dashboard". The pill is a native button with a focus-visible ring. The canvas is aria-hidden.
- The face is static, so there's nothing to check for reduced motion. It looks the same in both themes, as the spec says. The pill uses the existing chip tokens (ink on surface-200).

## Design system (published, user-approved)

- Added `stone` #4a4d4a and `stone-deep` #3d403d.
- Added a `components/Stele` README and preview: placement beside the Cubs basket, with the pill directly above.
