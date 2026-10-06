# den-layout/04 qa verify handoff

```json
{
  "ticket": "den-layout/04-walk-mode-in-the-new-den",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify done at a3dcd59. All 7 tests pass (npm test 7/0), all pass in smoke:ui (10/0). No test modifications since specify commit 0b46b9a. All acceptance criteria covered by passing tests.",
  "artifacts": [
    "tests/den-layout-04-walk-mode-in-the-new-den: 7 passing tests (unmodified from specify)"
  ],
  "decisions": [
    "walk.test.mjs changes (old bounds rectangle → new circle): these are implementation pins, not acceptance-criteria tests, so no bounce. Changes are only to adapt bounds checks from -11.65..11.65, -10.4..9.35 to hypot(x,z) <= 24.5 - 0.26, plus one diagonal case. All new bounds checks still verify the walker cannot leave the floor, a safety property the criteria require.",
    "smoke:ui walk check passed: user can enter den, move with W, view is restored when Esc exits, and signs move and restore correctly. All observable behaviors in the acceptance criteria are covered."
  ],
  "failures": [],
  "pending": []
}
```

## Criterion to test map

| Criterion | Test | Pass |
|---|---|---|
| Walk mode enters, moves and exits in the new den with den-v1/03's controls | "walk mode enters, moves with W and exits with Esc on the new den, with den-v1/03 controls" | ✅ |
| Movement is blocked by the site plan's stations and walls | "the walker is blocked by each of the four station stalls in the site plan, from every side"; "the walker is blocked by the rest of the site plan: lantern posts, dining table, mahjong table, festival, tea pond and construction pads"; "the walker cannot leave the garden: every point past the floor edge (radius 24.5) is blocked" | ✅ |
| The spawn point is inside a walkable area of the site plan | "the spawn point is inside a walkable area of the site plan, clear of every obstacle with room around it" | ✅ |
| `npm test` and `npm run smoke:ui` pass | "from the spawn the walker can reach every station and every leisure zone of the site plan"; "the walk check is back in smoke:ui against the new den"; smoke:ui: PASS walk check | ✅ |

human-verified: the feel of walking the new den (camera framing, spawn view).

## Findings

QA pass. All 7 specified tests pass. No tests were removed or assertions loosened. All acceptance criteria have passing tests or are human-verified. Files touched (explorer.mjs, walk.mjs, walk.test.mjs, smoke-ui.mjs) are within ticket scope: walk mode implementation, its unit tests, and the smoke test. walk.test.mjs changes are adapting old den bounds pins to the new scene geometry; acceptance-criteria tests (walk-new-den.test.mjs) are unmodified.
