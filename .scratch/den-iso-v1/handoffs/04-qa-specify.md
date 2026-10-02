# den-iso-v1/04: qa specify handoff

Branch `tests/scene-dressing04`, commit `f6f7797`, on `origin/main` `d292137` (ticket 02 merged; the local `main` ref was stale, so I fast-forwarded to origin/main). Tests only; the product code is untouched. The ticket has no Comments, so the scope is its five criteria plus the orchestrator's dispatch (Steamers and Front of House to +-3.0).

```json
{
  "ticket": "den-iso-v1/04-scene-dressing",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing acceptance tests committed on tests/scene-dressing04 (f6f7797). Developer makes them pass.",
  "artifacts": [
    {"path": "apps/ui/src/scene/banquet-layout.test.mjs", "note": "pure model: move to +-3.0, ring, pads, labels, bamboo, no-panda-on-dressing; five old literals migrated"},
    {"path": "apps/ui/src/scene/scene-dressing-framing.test.mjs", "note": "new: geometric tests at the default frame, 1440x900 and 375x667"},
    {"path": "apps/ui/src/scene/scene-dressing-wiring.test.mjs", "note": "new: source wiring and aria-label biology scan"},
    {"path": "apps/ui/src/scene/handoffs.test.mjs", "note": "migrated: stationBearing front-of-house atan2(3.0, -1.4)"},
    {"path": "apps/ui/src/scene/roam.test.mjs", "note": "migrated: prop-clearance points now (-3.0,-1.4), (3.0,-1.4); passes before and after"}
  ],
  "decisions": [
    "Names are mine (the ticket leaves them open); see Interface below.",
    "Ring angles are parametric (x = cx + 7.3 cos t, z = cz + 6.3 sin t, t = 2 pi i / 48): the digest says 'even in angle' without saying which. Index 0 is +x, then toward +z.",
    "Footprint rule is checked with footprints I build in the test from the layout props (kiosk platform half 1.275 x 0.65 turned by stallYaw, table r 1.3, hamper r 0.55, Tally 1.1 x 0.12). The test demands no stone centre inside them, at least 36 and fewer than 48 stones, and that any step more than 0.34 clear of every footprint is NOT dropped. The developer may use larger footprints than mine, up to that margin.",
    "'Covers' in the geometric test is depth-aware: a stone, pad or stalk BEHIND a counter (nearer the back) is drawn under it and does not count, even where the screen rects overlap. Checked with a scratch implementation: stone 5 at (5.79, 1.43) overlaps the Pantry counter's rect on screen but is behind it. Signs are the stationLabels anchors; counters are the top-face rects used by default-framing.test.mjs.",
    "Pad labels: tested as 'coming online' plus the role name in both `label` and `ariaLabel`; exact wording is the developer's.",
    "Biology-word regexes in my tests are spelt in pieces, because scripts/organ-to-station.test.mjs scans the repo for the bare word. Full `npm test` on this branch: 1671 tests, 25 fail (all in the files above), nothing else.",
    "Verified satisfiable: a scratch implementation (deleted, git checkout) made every new test pass with the +-3.0 move.",
    "Pads are in the label and aria tests through DORMANT_PADS only; the chip itself (ChipLayer.jsx, station-labels.mjs) is outside the ticket's file list, so the wiring test accepts any of ChipLayer.jsx, Den.jsx, App.jsx or station-labels.mjs reading DORMANT_PADS."
  ],
  "failures": [],
  "pending": [
    {"item": "Implement the dressing and the +-3.0 move (see Interface); migrate the one legacy test in the next item", "owner": "developer"},
    {"item": "OPEN, needs a decision: horseshoe-layout.test.mjs:52-73 'default-camera counter rectangles clear kiosks, Bao and table' uses a table radius of 1.8 (the drawn tabletop, Market.jsx TOP_RADIUS). At Steamers x -3.0 its bounding rect overlaps the table's by about 2 px at 1440x900 (counter x1 564.1 vs table x0 562.0; all radii up to 1.7 pass). This is the only old test that breaks for a reason other than a pinned literal. Ticket 02's default-framing.test.mjs already uses TABLE.radius (1.3, den-map's number), where it passes. I did not touch it: switching 1.8 to TABLE.radius loosens an assertion, which is a call for the orchestrator or user, not me or the developer.", "owner": "orchestrator"},
    {"item": "Verify: criterion 5 (the user inspects the den in the browser and says it matches the frame)", "owner": "qa"}
  ]
}
```

## Interface the tests fix (all in `apps/ui/src/scene/banquet-layout.mjs`)

- `STONE_RING = { center: {x: 0, z: -2.4}, semiX: 7.3, semiZ: 6.3, count: 48, stone: {diameter: 0.34, thickness: 0.04} }`; centre equals Bao's xz.
- `stepStones() -> [{index, x, z}]`, index 0..47 in angle order, footprint-omitted steps dropped.
- `DORMANT_PADS = [{id:"library", name:"Library", x:-2.9, z:-7.2, radius:0.65, dashed:true, dormant:true, label, ariaLabel}, {id:"drum", ... x:2.9}]`.
- `BAMBOO_CLUSTERS = [{id, x, z, stalks, height}]`: back-left (-3.4, -8.5, 3, 3.0), back-right (3.6, -8.7, 3, 3.0), right-edge (7.8, 0.8, 2, 2.6). `bambooStalks() -> [{cluster, x, z, height, width: 0.13}]`, spaced 0.27 apart along x, centred on the cluster.
- `STALLS.steamers.x = -3.0`, `STALLS["front-of-house"].x = 3.0`.

## Criterion-to-test map

| Criterion / scope | Test |
|---|---|
| Stone ring has the digest's count and radius around Bao (pure) | banquet-layout.test: "the stone ring: 48 stones...", "every placed stone lies on the ellipse...", "the ring keeps at least 36...", "a stone is omitted only when...", "...extremes are all present" |
| Pads at the digest's positions, dashed, labelled "coming online" | banquet-layout.test: "Library and Drum are dashed dormant pads at...", "each pad is labelled 'coming online'...", "the pads sit inside the ring, about 1.0 unit in..."; framing: "the pads sit behind Bao's shoulders at the digest's pixels" |
| No stone, pad or bamboo covers a kiosk sign or counter at the default frame | scene-dressing-framing.test: "...covers a kiosk counter...", "...covers a kiosk sign anchor..." (both sizes); "both dormant pads fall inside the viewport" |
| Pads carry no biology word in any label or aria-label | banquet-layout.test: "the pads carry no biology word..."; wiring: "no aria-label literal in the scene or app source holds a biology word" |
| Bamboo (digest: three clusters) | banquet-layout.test: two bamboo tests; framing: "the right-edge bamboo cluster stays inside the 1440x900 viewport" |
| All placed by the layout module | wiring: "the scene draws the stone ring, the pads and the bamboo from the layout module", "world numbers are not copied", "pad labels reach the screen from DORMANT_PADS" |
| Pandas still never stand on open grass | banquet-layout.test: "no cell perch lands on a dormant pad or in a bamboo cluster" (the existing roam and placement tests keep covering the rest) |
| Orchestrator scope: Steamers and Front of House move to +-3.0 | banquet-layout.test: "Steamers and Front of House stand at x +-3.0..."; framing: "the Steamers and Front of House move reaches the screen" (digest pixels, 2 px, both sizes); migrated literals below |
| User verdict: the den matches the frame | human-verified (`ready-for-human`). Also human-verified: dashed look of the pads, stone and bamboo shapes and colours (`paver`, `grove-mid/hill/near`, `ground-shadow` per digest section 6), shading |

## Legacy tests that pinned the old +-3.3 (migrated in this commit, to the old value shifted by 0.3)

| File:line (before) | Change |
|---|---|
| banquet-layout.test.mjs:47-48 | centre slots [-3.3, 1.1, -1.4] / [3.3, ...] to +-3.0 |
| banquet-layout.test.mjs:54 | Steamers slot 0 x -3.950864384758237 to -3.650864384758237 |
| banquet-layout.test.mjs:126-127 | five-cell Steamers x -5.351728769516475 to -5.051728769516475 and -2.748271230483525 to -2.448271230483525 |
| handoffs.test.mjs:88 | stationBearing front-of-house atan2(3.3, -1.4) to atan2(3.0, -1.4) |
| roam.test.mjs:36 | clearance points (-3.3,-1.4), (3.3,-1.4) to (-3.0,-1.4), (3.0,-1.4); green before and after |

Not pinned, still green with +-3.0 (checked by running the scene tests with the scratch move): station-labels, default-framing, horseshoe targets (within 0.3), kiosk, tally, camera tests. Grep found no 3.3 literal in `apps/ci-cd`; I did not run `smoke:ui`.

## Red state

On this branch the suite fails only in the tests above: 25 failures in banquet-layout (the move and everything new), scene-dressing-framing, scene-dressing-wiring and handoffs, all for a missing export (`stepStones is not a function`, `DORMANT_PADS is not iterable`), a missing constant (`STONE_RING` undefined), the old x (-3.3 != -3), or a missing wiring reference. The framing file uses a namespace import so a missing export fails each test alone, not the file on import. The horseshoe 1.8 test (above) is green now and turns red once the developer makes the +-3.0 move.
