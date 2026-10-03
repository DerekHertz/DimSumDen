# den-v1/01 designer review (batch D1, PR #151 at 0604c76): Design pass

```json
{
  "ticket": "den-v1/01-resident-pandas-take-over",
  "cell": "designer",
  "mode": "review",
  "current_step": "Design review of the resident pandas and the five state chips at 0604c76. Built and ran the UI on the fixture bridge in headless Chromium: loads, 0 console errors. Pass. The five chips (plus Queued) are distinct by word, glyph shape and tone in both themes; the new Failed chip is right. Two low findings.",
  "artifacts": [
    "codex/procedural-den-frontend@0604c76",
    "apps/ui/src/scene/chip-model.mjs:7",
    "apps/ui/src/styles.css:129-139",
    "scratchpad shots: chips-light.png, chips-dark.png (3x crops of all six chips), d-light.png, d-dark.png"
  ],
  "decisions": [
    "Failed chip, pass. Word 'Failed', tone failed (alarm text and glyph), dotted 1 px border, triangle glyph (clip-path). Matches the iso-den spec line 'failed = triangle' and the alarm token for failed. Contrast, measured from computed styles: alarm #c1291b on #fffdf7 about 5.9:1 light; alarm #f45340 on #1f252b about 5:1 dark; both clear 4.5:1. Chip border line-strong against the surface about 3.3 to 3.6:1, clears the 3:1 non-text rule.",
    "Glyph set, 3x crops: Working = circle (qi), Needs you = rounded square on lantern fill, Blocked = square (alarm, dashed border), Failed = triangle (alarm, dotted border), Done = diamond (ink), Queued = dim circle. Every state also has its own word, so colour is never the only cue (WCAG 1.4.1). Done reads neutral (ink), which is fine: it is calm, not celebratory.",
    "Resident pandas in the den (d-light.png): four stalls each hold a resident panda, two pads (Library, Drum) hold one each, roamers on the grass, Bao in the centre. Chips hang over the stall they belong to and stay legible on the light and dark grove. Queued chips stand on the susan baskets.",
    "Herald has no resident panda: user decision, not a finding. PandaCard.jsx not reviewed (04 parked)."
  ],
  "failures": [],
  "pending": [
    {"item": "F4 (low): Needs you and Blocked glyphs differ only by a 2 px corner radius on an 8 px shape (styles.css:133 vs :135), which is hard to tell apart at 1x. The chips still differ by fill (amber vs surface), border (solid vs dashed) and word, so the AC holds, but the glyph test in chip-model.test.mjs treats 2px vs 0 as distinct shape. Cheap fix: make the Needs you glyph a circle with a ring or a small bell/lantern clip-path, or make it 10 px; keep Blocked as the square.", "owner": "developer"},
    {"item": "F5 (low): the dotted (Failed) and dashed (Blocked) chip borders are 1 px and nearly alike at 1x; the glyph (triangle vs square) and the word carry the difference. Optional: use a 2 px border on Failed for emphasis, as the failed card has a top edge in alarm.", "owner": "developer"},
    {"item": "Design system upkeep: add Failed to the scene-chip component (word, alarm tone, triangle glyph, dotted border) and list the six glyph shapes. Needs user approval before publish. Also state in docs/design/2026-10-01-iso-den.md that pandas now roam the grass (den-map.md says they never do).", "owner": "designer"}
  ]
}
```

Unchecked: the 3D poses of done vs failed (qa notes they differ only slightly; the chip glyph is the shape cue, accepted); a live fixture with a running agent in each of the five states (the fixture holds only Needs you, Blocked, Queued, so Working, Failed and Done chips were rendered from the real stylesheet classes in a strip, not from live agent data; the tone-to-state mapping is covered by chip-model.test.mjs).
