```json
{
  "ticket": "den-scene-v1/05-tally-abacus",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed on feat/tally05 at 689ae1f (base 684ccbf); every criterion mapped; ready for the developer",
  "artifacts": [
    "apps/ui/src/scene/tally-face.test.mjs",
    "apps/ui/src/scene/tally-stele.test.mjs",
    "apps/ui/src/scene/tally-pill.test.mjs",
    "apps/ui/src/scene/tally-expand.test.mjs",
    "apps/ui/src/scene/tally-card-wiring.test.mjs",
    "apps/ui/src/panel/usage-meter-model.test.mjs"
  ],
  "decisions": [
    "Interfaces pinned by the tests (names the designer spec left open): tally-face.mjs exports beadCount, tallyRods, beadSlide, abacusLayout, TALLY_RODS_CAPTION, BEAD_SLIDE_MS; TALLY gains frame and leg and loses plinth and tablet",
    "The old three-chart tallyFace tests were removed: the abacus no longer draws charts, the Dashboard moves into the card",
    "Card markup seam: data-rod and data-counted per row, data-mark=80 on the 5 h and Week rows, class tally-card",
    "Alarm threshold follows the spec: counted beads turn alarm when value > 95 (95 stays qi), while status text 'At limit' keeps the sidebar's >= 95"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Make the tests pass without weakening them; see the criterion map and contracts below",
      "owner": "developer"
    }
  ]
}
```

State: done (qa specify). Tests commit: **689ae1f** on branch `feat/tally05` (base 684ccbf). Tests only; no product code.

## Red run

Ran each file alone. All new tests fail for a missing feature (missing export, undefined `TALLY.frame`, no `dialog`, no `.tally-card` rule). No syntax, import-path or setup failures. The pure-model file `tally-face.test.mjs` fails as one block today because the module lacks the new exports. I proved it satisfiable: a throwaway reference implementation (scratchpad, not committed) passes all 32 model and usage tests, and a temporary `TALLY.frame/leg` patch (reverted) passes the 15 placement and pill tests, leaving only the JSX source tests red.

## Criterion to test map

Ticket criteria:

| Criterion | Test |
|---|---|
| Five labelled rods in order | `tally-face.test.mjs` "five rods in order" |
| Count = round(value/scale x 10), incl. 0 and 100% | `tally-face.test.mjs` "counted beads = round(...)" (beadCount table), "worked fixture counts", "usage rods at 0 and 100" |
| 79% -> 8 beads + 80% mark; 96% -> alarm | `tally-face.test.mjs` fixture counts, "past 95 percent", "80% mark"; `tally-expand.test.mjs` "usage at 96/86/79" |
| 5 h and Week read the same source | `tally-face.test.mjs` "same values as the sidebar meter's usage object"; `tally-expand.test.mjs` meters test uses the stubbed `/state` usage |
| role=meter with exact % in the name | `tally-expand.test.mjs` "exactly two role=meter..." |
| Click/Enter opens the dashboard without scroll | Superseded by the expanded view (rows below) |
| No stone geometry; user visual verdict | `tally-stele.test.mjs` "no stone stele geometry remains" (source + layout); visual part human-verified |

Scope comments and spec (spec-2 section 11 numbering):

| Item | Test |
|---|---|
| 1 click, Enter, Space open; aria-expanded; focus on heading; no scroll | `tally-expand.test.mjs` (click test, Enter/Space loop) |
| 2 abacus mesh click opens, never closes | `tally-expand.test.mjs` "a click on the abacus in the scene..." |
| 3 Esc, Close, pill close with focus on pill; outside pointerdown does not | `tally-expand.test.mjs` three tests |
| 4 exactly two role=meter closed and open | `tally-expand.test.mjs` meters test |
| 5 five rows, counts, 80% tick only on 5 h/Week | `tally-expand.test.mjs` "card rows"; layout: `tally-face.test.mjs` layout tests |
| 6 unsampled, loading, error strings, Retry stays | `tally-expand.test.mjs` three state tests |
| 7 arrow keys, + and - do not reach the camera | `tally-expand.test.mjs` keydown test (with a control on `main`) |
| 8 reduced motion | `tally-expand.test.mjs` reduced-motion test; `beadSlide` unit test for the bead tween |
| 9 no sidebar Pipeline, Dashboard mounted once, usage slot stays | `tally-expand.test.mjs` sidebar test; `tally-card-wiring.test.mjs` |
| 10 640px sheet rule | `tally-card-wiring.test.mjs` "phone width" |
| Placement (spec 3), tokens `--dur-base`, `--shadow-panel`, `--station-steamers`, `--scene-bottom-inset` | `tally-expand.test.mjs` placement; `tally-card-wiring.test.mjs` |
| Frame 1.1x1.4x0.12, legs, anchor +0.27, clearance, low-poly, wood literals | `tally-stele.test.mjs`, `tally-pill.test.mjs` |
| Slide only on change, 240 ms | `tally-face.test.mjs` `beadSlide` test |
| `sampledText` on usageMeterModel | `usage-meter-model.test.mjs` (two tests) |

## Contracts the developer must meet

- `tally-face.mjs`: `beadCount(value, scale)`; `tallyRods(usage, dashboardModel, nowMs)` returning `{ rods, caption, sampledText }`; each rod `{ id, label, kind, counted, color, valueText, statusText, mark80, ariaLabel, valueNow }`, ids `five-hour|week|served|tokens|spills`, colour names `qi|station-steamers|alarm`; `beadSlide(prev, next, {reducedMotion})` returns `{animate, durationMs}` (240); `abacusLayout()` returns `{ rodYs, labelColumnRight, beadSpan, mark80X, beadX(counted) }` in frame-centre local units. A full rod must sit visibly right of an empty one, so beads need a gap (squash them to fit the 0.66 span).
- `banquet-layout.mjs`: `TALLY.frame = {width:1.1,height:1.4,depth:0.12,bar:0.08}`, `TALLY.leg = {width:0.08,height:0.15}`, no `plinth` or `tablet`; `tallyAnchor().y` = 1.82.
- Card DOM seam is documented at the top of `tally-expand.test.mjs`.
- Float-safe text: Spills sum 0.2 + 0.1 must print "0.3 / ticket".

## Things the developer will trip on (outside the named Files)

- `apps/ui/src/scene/roam.mjs:18` reads `TALLY.plinth`; update it to `TALLY.frame` (the obstacle test expects the 1.1 x 0.12 footprint plus 0.1 margin covered).
- `apps/ci-cd/smoke-ui.mjs:127-130` selects `[data-slot=dashboard]`; removing the sidebar slot breaks `npm run smoke:ui`. It must be updated (charts now live in the card; the open step is needed).
- Pre-existing bug the tests pin: with no active tickets, `p.scene-caption.scene-empty` ("The den is quiet") sits over the Tally pill and intercepts its clicks (found by Playwright). One test ("a quiet den ... does not block the pill") requires the caption to stop blocking, e.g. `pointer-events: none`. Orchestrator may drop that test if it is out of scope.
- `.scene-empty` aside, the browser test needs Chromium (works here with `buildLaunchOptions`) and takes about 1 to 2 minutes; it stubs `/state`, `/metrics` and a fake EventSource.
- Existing `tally-pill.test.mjs` and `tally-stele.test.mjs` were rewritten for the abacus (same invariants, frame instead of plinth/tablet).

## Human-verified (not automated)

- Visual verdict on the abacus: wood reading, proportions, bead sliding feel, 80% tick placement, counted beads in 3D (the 3D bead counts are covered by the model unit tests, not by pixels).
- 375px phone visual check (blocked by `.shell { min-width: 1280px }` until 07/10; only the CSS rule is tested).
- Card closing when the camera leaves Level 1 (zoom switcher and station pills arrive in 07).
- Dark theme bead colours.

Suggested skills: organism-protocol, implement, tdd.
