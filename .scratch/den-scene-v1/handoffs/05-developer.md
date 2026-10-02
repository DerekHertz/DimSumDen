```json
{
  "ticket": "den-scene-v1/05-tally-abacus",
  "cell": "developer",
  "current_step": "All of qa's tests pass on feat/tally05 (a8ec4e4); npm test 1446/1446, smoke:ui green; ready for qa verify",
  "artifacts": [
    "apps/ui/src/scene/tally-face.mjs",
    "apps/ui/src/scene/TallyFace.jsx",
    "apps/ui/src/scene/TallyCard.jsx",
    "apps/ui/src/scene/system-theme.js",
    "apps/ui/src/scene/ChipLayer.jsx",
    "apps/ui/src/scene/banquet-layout.mjs",
    "apps/ui/src/scene/roam.mjs",
    "apps/ui/src/App.jsx",
    "apps/ui/src/styles.css",
    "apps/ci-cd/smoke-ui.mjs"
  ],
  "decisions": [
    "stage.tallyHit flag: the abacus group's onPointerDown sets it and the card's document pointerdown listener reads and clears it, so a press on the abacus never counts as an outside press (qa test: a second click on the abacus must leave the card open)",
    "Card keydown stopPropagation is a native listener on the card element: React's synthetic stopPropagation runs at the root, after the camera rig's listener on main, so it would not have stopped the camera",
    "80% mark is two lantern-fill ticks on the inner edges of the frame's top and bottom bars at mark80X (the spec's literal wording). A tick on the rod itself was hidden by left-packed beads below 8 counted (code review finding)",
    "Rods start at the label column (x -0.21) rather than spanning the whole frame, so the sans labels do not sit on the rod line",
    "Alarm colour uses value > 95 (spec), status text 'At limit' uses >= 95 (sidebar meter); the one-point disagreement at exactly 95 is intended and commented",
    "Extracted useSystemTheme from Market.jsx into scene/system-theme.js (shared by TallyFace); exported useNow from Panel.jsx and tokenText from dashboard-model.mjs; added sampledText to usageMeterModel",
    "Edited brand.test.mjs (not one of qa's ticket tests): added '.tally-card h2' to the allowed display-font users, since spec-2 sets the card heading in Long Cang. Orchestrator scope decisions applied: roam.mjs TALLY.frame, smoke-ui.mjs charts check now opens the card, .scene-caption pointer-events none (quiet den no longer covers the pill)",
    "Scene beads read token colours from the CSS custom properties (--qi, --alarm, --lantern-fill, --rice-paper) and stationHue('steamers', theme), so they follow the live system theme",
    "Added --dur-base, --shadow-panel, --station-steamers (light and dark) to styles.css"
  ],
  "failures": [],
  "pending": [
    {
      "item": "qa verify (light, since qa specified): run tally-expand.test.mjs (about 1 to 2 min, Chromium) and npm run smoke:ui; then npm run risk-check",
      "owner": "qa"
    },
    {
      "item": "User visual verdict: wood, proportions, bead slide feel, 80% ticks, dark-theme beads, abacus labels legibility (labels are small at the default camera)",
      "owner": "orchestrator"
    },
    {
      "item": "Not implemented from spec-2, for the orchestrator to ticket or accept: (1) card close animation (dur-fast reverse), it unmounts immediately; (2) closing when the pill becomes hidden or the camera leaves Level 1 (no camera levels exist until 07)",
      "owner": "orchestrator"
    },
    {
      "item": "Proposed design-system tokens wood (#8A5A34) and wood-deep (#4A2E1C); scene literals for now",
      "owner": "designer"
    },
    {
      "item": "Possible cleanups left out of scope: TALLY_ARIA_LABEL wording is stale (name pinned by tests); tally-face.mjs INNER constants could derive from TALLY.frame; file names Stele/TallyFace kept per the ticket",
      "owner": "orchestrator"
    }
  ]
}
```

State: in-review (developer). Branch `feat/tally05`, tests commit 689ae1f, implementation 39bd702 and a8ec4e4.

What changed: the stone stele is gone. TallyFace.jsx draws a low-poly wooden suanpan (box frame and legs, cylinder rods, 8x6 sphere beads squashed to fit, canvas paper backing with the Long Cang heading and Nunito labels). tally-face.mjs is now the pure view-model (beadCount, tallyRods, beadSlide, abacusLayout). TallyCard.jsx is the non-modal dialog opened by the pill or a click on the abacus; it holds the five rods and the moved Dashboard. App.jsx loses the Pipeline slot and the scroll effect and gains tallyOpen/openTally/closeTally/toggleTally. ChipLayer's pill gets aria-expanded/haspopup/controls and the two hidden role=meter twins (not rendered while the card is open).

Checked: tally-face, tally-stele, tally-pill, tally-card-wiring, usage-meter-model and tally-expand (18 browser tests) all pass; npm test 1446 pass, 0 fail; npm run smoke:ui passes. Screenshots (light and dark, closed and open) looked right; the rod row, 8-bead count at 79% and red 10 beads at 96% read correctly. I did not test the 375px phone layout (shell min-width blocks it).

Code review (standards and spec sub-agents) findings fixed: 80% tick placement, Sampled line position. Declined: duplicated 80/95 thresholds (spec mandates the > 95 vs >= 95 split), minor markup duplication between ChipLayer twins and card rows.

Suggested skills: organism-protocol, qa verify.
