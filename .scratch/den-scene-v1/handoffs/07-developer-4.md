# den-scene-v1/07 developer fix round 4: designer N1 (intent placeholder truncation)

Branch feat/floating-cards07, commit f787331 on top of a0fea6c. CSS only plus one new test.

```json
{
  "ticket": "den-scene-v1/07-sidebar-overlays",
  "cell": "developer",
  "current_step": "N1 fixed and committed at f787331. The placeholder now fits at 600, 650, 709, 710, 768, 899, 900, 925, 960, 1024 and 1440 px. Ready for qa verify and the user's visual verdict.",
  "artifacts": [
    "apps/ui/src/styles.css (intent rules under 900 and a 900-959 hint rule)",
    "apps/ui/src/overlay/floating-cards.test.mjs (new test: designer N1)"
  ],
  "decisions": [
    "Under 900px the intent bar anchors left 160px / right 16px / max-width 580px with transform none, as the designer proposed; the timeline is hidden there, and the zoom switcher ends near 141px",
    "Hid the Ctrl K hint only from 900 to 959px, not under 960 as the designer proposed: the existing F2 test requires the hint visible at 600, and the left-anchored bar gives the input about 230px there, enough with the hint showing. No existing assertion was loosened",
    "The 599px block now resets left to 16px and max-width to none; with right 16px and width auto the phone bar stays 100vw - 32px (the 390px phone test still passes)",
    "New test measures the placeholder text against the input's room, zoom/intent overlap, the right gutter, and timeline overlap where visible, at 11 widths from 600 to 1440. It failed first (600: needs 171px, input has 61px)",
    "N2 (Gated chip text contrast) left out of scope; the designer says it can ride with den-scene-v1/13"
  ],
  "failures": [
    "Full npm test run once showed 1 failure of 1696: 'Ctrl+Enter in the Note sends Deny...' (ruling: m). It passes alone and in the whole floating-cards file (33 of 33), and the change is CSS only, so I read it as a flake under parallel load. Not reproduced"
  ],
  "pending": [
    {
      "item": "qa verify of f787331; user's visual verdict on the 3D scene, and a look at 600 to 709 and 900 to 959 px",
      "owner": "orchestrator"
    }
  ]
}
```

## Checked

`node --test apps/ui/src/overlay/floating-cards.test.mjs`: 33 of 33 pass. `npm test`: 1695 of 1696 pass, the one failure being the flake above.

## Unchecked

No screenshots at 600 to 709 or 900 to 959 px; the new test measures text fit and boxes, not looks. Left-anchoring means the bar jumps from centred (900) to x 160 (899); the designer proposed it.
