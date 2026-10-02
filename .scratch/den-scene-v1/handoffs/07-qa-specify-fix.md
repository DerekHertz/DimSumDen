# den-scene-v1/07 qa specify fix: tests 18 and 24 repaired, 25 of 25 green

Branch `feat/floating-cards07`, commit c4ff513 (on top of the developer's WIP 1105e00). Only `apps/ui/src/overlay/floating-cards.test.mjs` changed (+7 lines, no assertion removed or loosened).

```json
{
  "ticket": "den-scene-v1/07-sidebar-overlays",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Test fixes committed; floating-cards.test.mjs run serially against the developer's WIP: 25 pass, 0 fail, 0 skipped",
  "artifacts": [
    "branch feat/floating-cards07 (c4ff513)",
    "apps/ui/src/overlay/floating-cards.test.mjs"
  ],
  "decisions": [
    "Test 24: after the Stations header click, focus main[aria-label='Den scene'] before the Tab loop so the walk starts at the document start of the overlays, not at the clicked header. Harness fix; every assertion (order, labels, 10+ stops, 2px ring) unchanged",
    "Test 18: openApp now calls lightenScene(context) (apps/ci-cd/light-scene.mjs, same as tally-expand.test.mjs) so software-GL frame starvation no longer times out the 80 clicks. Applied to every test in the file; they read DOM only, never pixels. The earlier timeouts of 13 and 14 under load did not recur in this run",
    "No app code touched"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Migrate old tests (tally-card-wiring, tally-expand, brand, smoke-ui), run npm test and smoke:ui, camera-store and overlay-model unit tests, /code-review, final commit; the test 18 slowness was a harness effect, not an app bug",
      "owner": "developer"
    },
    {
      "item": "Designer review: keys m/j/k, 16px vs 18px station dot, eyebrow case, Level 2/3 zoom values",
      "owner": "designer"
    }
  ]
}
```

## Criterion-to-test map

Unchanged from 07-qa-specify.md; the 25 tests are the same, with the same names and assertions. Human-verified items are unchanged.

## Run

`node --test --test-concurrency=1 apps/ui/src/overlay/floating-cards.test.mjs`: tests 25, pass 25, fail 0, skipped 0.
