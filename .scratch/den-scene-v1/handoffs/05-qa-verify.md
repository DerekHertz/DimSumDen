```json
{
  "ticket": "den-scene-v1/05-tally-abacus",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify complete: npm test 1446/1446 pass, npm run smoke:ui passes, qa tests intact from 689ae1f except justified brand.test.mjs edit; ready for npm run risk-check and security review",
  "artifacts": [
    "apps/ui/src/scene/tally-face.test.mjs",
    "apps/ui/src/scene/tally-stele.test.mjs",
    "apps/ui/src/scene/tally-pill.test.mjs",
    "apps/ui/src/scene/tally-expand.test.mjs",
    "apps/ui/src/scene/tally-card-wiring.test.mjs",
    "apps/ui/src/panel/usage-meter-model.test.mjs",
    "apps/ui/src/brand.test.mjs"
  ],
  "decisions": [
    "brand.test.mjs edit justified: adds '.tally-card h2' to allowed display-font users per spec-2 section 2 (Tally heading uses --font-display)"
  ],
  "failures": [],
  "pending": [
    {
      "item": "npm run risk-check (orchestrator or security)",
      "owner": "security"
    }
  ]
}
```

State: in-review (qa verify light). Branch `feat/tally05`, a8ec4e4.

## Verdict: QA pass

Light verify confirms:
- npm test: 1446 tests pass, 0 fail, 0 skipped
- npm run smoke:ui: all 6 checks pass (load, font, scene, queue, chart, approve)
- qa test files from 689ae1f remain unchanged except brand.test.mjs, which justifiably adds `.tally-card h2` to display-font users per spec-2
- Every acceptance criterion maps to a passing test or human-verified item

Criterion coverage:
- Five labelled rods in order: tally-face.test.mjs "five rods in order" - PASS
- Count = round(value/scale x 10): tally-face.test.mjs fixtures - PASS
- 79% -> 8 beads + 80% mark; 96% -> alarm: tally-face.test.mjs + tally-expand.test.mjs - PASS
- 5 h and Week read same source: tally-face.test.mjs + tally-expand.test.mjs - PASS
- role=meter with exact % in name: tally-expand.test.mjs "exactly two role=meter..." - PASS
- Click/Enter opens view without scroll: Superseded by spec-2 expanded view; tests PASS
- No stone geometry; user visual verdict: tally-stele.test.mjs - PASS; visual human-verified

Scope items all pass: low-poly frame, five rods, expanded card, Pipeline charts moved, roam.mjs and smoke:ui updated.

Human-verified deferred (acceptable): abacus visual verdict, 375px phone layout, dark theme, camera-level close (ticket 07).

All qa tests from specify pass unchanged. Ticket ready for npm run risk-check and security review.
