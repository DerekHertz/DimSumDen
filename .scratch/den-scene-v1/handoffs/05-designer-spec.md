```json
{
  "ticket": "den-scene-v1/05-tally-abacus",
  "cell": "designer",
  "mode": "spec",
  "current_step": "UI spec written to the ticket's Comments; ready for qa specify",
  "artifacts": [
    ".scratch/den-scene-v1/issues/05-tally-abacus.md"
  ],
  "decisions": [
    "Served/Tokens/Spills scales (no absolute scale existed): Served 10 tickets per latest window, Tokens 200k mean per-ticket, Spills 1.0 summed per-ticket incidents; dashboard caption states them",
    "Wood and rod colours are scene literals (#8A5A34, #4A2E1C) because no wood token exists"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Map every spec item and acceptance criterion to failing tests",
      "owner": "qa"
    }
  ]
}
```

State: done (designer spec). No code, no commits. Base 9eadf0c.

What changed: one ticket comment with the full spec: layout (frame, legs, paper backing, rods, beads, 80% ticks), tokens, count rule clamp(round(value/scale*10),0,10), states (unsampled, metrics error, clamp, reduced motion), copy, and a11y (visually hidden role=meter twins in ChipLayer, the pill as the only tab stop).

Decisions for the user to confirm at verdict: the three non-usage scales (they were never defined, and the ticket allowed the designer to pick them), and the proposed design-system tokens `wood` and `wood-deep`. Neither blocks the build.

Gotchas:
- The `dur-base` token (240ms) is in docs/design/tokens.json but not in styles.css. The slide runs in three.js, so use the 240ms literal or add the CSS var.
- The criterion "open without page scroll" conflicts with App.jsx openDashboard, which today scrolls the dashboard into view. qa should pin down what the user meant (probably: no stray scroll from Space/Enter on the pill).
- Ticket 07 removes the sidebar meter. 05 must not.

Suggested skills: organism-protocol, tdd.
