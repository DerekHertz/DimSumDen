# Handoff: showcase-v1/03 fix round 2: developer

```json
{"ticket": "showcase-v1/03", "cell": "developer", "current_step": "Tally moved left of Bao; awaiting qa verify",
 "artifacts": ["apps/ui/src/scene/banquet-layout.mjs", "apps/ui/src/scene/tally-face.test.mjs"],
 "decisions": ["Tally at x -3.0, z 0.3: mirrored to the left, and z is the furthest back that keeps the 1.0 gap from Bao's box and the 0.45 gap from the Steamers stall at six cells"],
 "failures": [],
 "pending": [{"item": "browser re-check of Tally's new spot", "owner": "qa"}]}
```

## State
Done, in-review. Branch `showcase-v1/integration`.

## What changed
`TALLY` moved from x 2.9, z 0.8 to x -3.0, z 0.3. Clearance tests now check Bao and his shoulder cells, the table, Steamers and Tea stalls at six cells, and the cub basket; the sight-line test now covers the Steamers cells (slot 2 is behind the slate, which passes under it). Right-hand stalls and their labels are uncovered.

## Gotchas
It cannot go much further back: Bao's shoulder-cell gap and the Steamers stall's front edge bound z from below. Scene/UI tests: 280 pass.
