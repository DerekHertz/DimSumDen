# Handoff: 09 designer review (Design bounce)

```json
{
  "ticket": "den-scene-v1/09-role-headgear-assets",
  "cell": "designer",
  "mode": "review",
  "current_step": "Review done at 030c706: Design bounce. 4 high findings (paw props sideways, product/architect not distinct, qa/security headgear hidden by front-row noren at Level 1, headgear floating off the face). Build runs, no console errors. Fixes below are numbered and verified in a render where marked.",
  "artifacts": [
    "/tmp/claude-1000/-home-dhertzell-dimsumden--claude-worktrees-frontend-orchestrator-impl-f501eb/587a67b3-1d35-43a1-b219-36510ec04db1/scratchpad/shots/sheetA.png",
    "/tmp/claude-1000/-home-dhertzell-dimsumden--claude-worktrees-frontend-orchestrator-impl-f501eb/587a67b3-1d35-43a1-b219-36510ec04db1/scratchpad/shots/sheetB.png",
    "/tmp/claude-1000/-home-dhertzell-dimsumden--claude-worktrees-frontend-orchestrator-impl-f501eb/587a67b3-1d35-43a1-b219-36510ec04db1/scratchpad/shots/sheetC.png",
    "/tmp/claude-1000/-home-dhertzell-dimsumden--claude-worktrees-frontend-orchestrator-impl-f501eb/587a67b3-1d35-43a1-b219-36510ec04db1/scratchpad/shots/sheetE.png",
    "/tmp/claude-1000/-home-dhertzell-dimsumden--claude-worktrees-frontend-orchestrator-impl-f501eb/587a67b3-1d35-43a1-b219-36510ec04db1/scratchpad/shots/sheetP1.png",
    "/tmp/claude-1000/-home-dhertzell-dimsumden--claude-worktrees-frontend-orchestrator-impl-f501eb/587a67b3-1d35-43a1-b219-36510ec04db1/scratchpad/shots/sheetP2.png",
    "/tmp/claude-1000/-home-dhertzell-dimsumden--claude-worktrees-frontend-orchestrator-impl-f501eb/587a67b3-1d35-43a1-b219-36510ec04db1/scratchpad/shots/live_light.png",
    "/tmp/claude-1000/-home-dhertzell-dimsumden--claude-worktrees-frontend-orchestrator-impl-f501eb/587a67b3-1d35-43a1-b219-36510ec04db1/scratchpad/shots/cropL1.png",
    "/tmp/claude-1000/-home-dhertzell-dimsumden--claude-worktrees-frontend-orchestrator-impl-f501eb/587a67b3-1d35-43a1-b219-36510ec04db1/scratchpad/shots/cropL2.png",
    "/tmp/claude-1000/-home-dhertzell-dimsumden--claude-worktrees-frontend-orchestrator-impl-f501eb/587a67b3-1d35-43a1-b219-36510ec04db1/scratchpad/shots/wide_dark.png"
  ],
  "decisions": [
    "Design bounce: high findings H1-H4 below. The user's final visual verdict waits for a round 2 with these fixed.",
    "Scarf size is fine as built (collar reads at Level 1 and in 3/4, no change needed).",
    "Pencil fallback for architect is required (product and architect are indistinguishable at Level 1).",
    "Front-row noren clipping qa/security headgear is a kiosk/layout issue (den-scene-v1/03), not a gear issue; it needs an orchestrator/user call on the trade-off with the back-counter sight line."
  ],
  "failures": [
    "No browser pane tool (mcp__Claude_Browser__*) in this session; reviewed with the repo's own Playwright (vite dev server + headless chromium, swiftshader) driven from scratch scripts. A temporary harness under apps/ui/designer-harness was removed; worktree is clean.",
    "Chrome, mobile and reduced-motion runs are headless only; no real GPU."
  ],
  "pending": [
    {"item": "Round 2 of headgear/prop fixes H1, H2, H4, M1-M3 (numbers below)", "owner": "developer"},
    {"item": "Decide front-row noren/eave change so qa and security headgear shows at Level 1 (H3)", "owner": "orchestrator"},
    {"item": "Re-render and re-run silhouette check after fixes, then the user's verdict", "owner": "designer"}
  ]
}
```

## Verdict

Design bounce. The build runs (page loads, no console errors apart from the aborted /events of my test harness, glb loads). Procedural parts, theme swap, and unknown-role handling work. But at the default Level 1 camera, 4 of 9 roles do not read as distinct, and every held prop is turned sideways.

## What was run

- Dev scene on the branch at 030c706 via vite, headless chromium, DPR 2, viewports 1440x900, 1440x1300, 2300x1100, 390x844. All 9 roles fed through a mocked snapshot (EventSource + /state), so the debugger and a real orchestrator cell render. Light and dark themes; reduced motion on at 390 wide.
- A close-up rig (panda.glb plus headgear.mjs, gear-object.mjs, ROLE_PLACEMENT) rendered each role front, three-quarter and side (shots in scratchpad, sheets A, B, C, E).
- Head-surface and socket frames measured by raycast (below).

## Level 1 silhouette table (front + three-quarter, default camera)

| Role | Cue | Reads at Level 1? |
|---|---|---|
| orchestrator | toque + purple band | Yes. Tallest, unique. |
| product | round spectacles | Reads as "spectacles", identical to architect. |
| architect | round spectacles | FAIL as a pair (H2). |
| developer | headphones | Yes in the back row; the ink band merges with the black ears (M3). |
| scout | goggles on forehead | Yes, distinct from spectacles (cyan lenses). Floats in 3/4 (H4). |
| debugger | headlamp | Yes at the cub row (large); reads as a head-mirror with an antenna, see L3. |
| qa | douli | Strongest shape in close-up, but hidden by the kiosk noren in the Den (H3). |
| security | cap | Same as qa (H3). Front view with brim hidden reads as a green helmet. |
| designer | beret | Yes. |

## High findings

**H1. Props point at the camera, not up (paw-socket orientation, confirmed).** Measured at sit_still: paw_L/paw_R sit at world (+-0.72, -0.40, 0.64). Socket +y points to world +z (at the camera) and socket +z points up. Props were built long axis +y, so every long prop is seen end-on and every flat prop lies face-up (sheetA product/architect/developer: flat slivers; ladle: a black blob). Also the socket is the centre of a r=0.19 fist, so a prop centred on it is half buried. Fix, verified in sheetP1/P2:
- Rotate the prop group Euler XYZ (pi/2, pi, 0). Prop +y becomes world up, prop +z faces the camera. Ladle, magnifier, chopsticks then stand upright with the grip in the fist (no offset).
- For the flat props (menu, slips, tablet, plate, teacup, seal) also offset the group by [0, +0.26, +0.22] in socket axes (0.26 toward the camera, 0.22 up). With that, menu (two panels), clipboard (dark clip, two slips), tablet, plate with garnish, teacup and stamp all read (sheetP2 *_off).

**H2. Product and architect are identical (spectacles). The pencil fallback is needed.** At Level 1 (head ~30 px wide at 1x) the held prop is invisible, so the silhouette is the only cue, and both wear the same octagonal rims in the same station hue scarf. Build the pencil behind the left ear: at Level 1 a 0.07-radius pencil would be 1-2 px, so size it up: radius >= 0.09, length >= 0.7, tilted ~25 deg off vertical at x = -0.55 (ear), z -0.2, rising above the ear line, in wood with an ink tip and a cream ferrule so it holds against the sky and bamboo. Alternative if you prefer: give the architect square-rimmed spectacles. Either way the pair must read apart in the front view without the prop.

**H3. qa and security headgear is hidden at Level 1 in the Den (kiosk, not gear).** The front-row kiosk noren hangs in front of the heads (cropB/L2: douli and cap invisible, the top of the head also cut). Numbers: front-row counter 0.6 + footLift 0.3 + hat socket 0.97*0.3 puts the head top at world y ~1.19, the douli tip ~1.28. The front-row noren is `top: eave 1.4`, `drop: 0.22` (kiosk.mjs:25-30), so its bottom edge is 1.18, and the camera looks down ~11 deg plus 0.4 of depth between noren and head, which hides everything above y ~1.03 at the panda. For the douli and cap to show, the noren bottom must clear ~1.55 (tip 1.28 + 0.15 sight-line + 0.1 margin): either eave >= 1.77 with drop 0.22, or drop <= 0.08 with eave 1.6. Raising the eave works against FRONT_ROOF's rule (apex must stay under the sight line to the back counters), so this is a trade the orchestrator/user must call; I did not pick one. The back row (steamers, front-of-house) clears: goggles and beret show.

**H4. Headgear floats off the face and is centred 0.2 too far forward (spectacle/goggle z, confirmed).** The developer assumed head front z ~0.6; it is 0.34 at the eyeline, and the head is centred at z ~ -0.15 (crown peak at z -0.2, rel y -0.02), not at the socket origin. Front-surface z in the hat frame, y relative to the hat socket (+up), from raycast:

| rel y | x=0 | x=0.27 | x=0.45 |
|---|---|---|---|
| -0.12 | 0.14 | - | - |
| -0.20 | 0.24 | 0.14 | ~0.0 |
| -0.42 | 0.34 | 0.23 | 0.085 |

Where the headgear is now vs surface: spectacle rims z 0.62 vs 0.23 (0.39 off, floating in every 3/4 view); goggle rims 0.56 and lenses 0.62 vs ~0.16 (0.4 off); headlamp lamp 0.60 and lens 0.70 vs 0.14; cap brim centre 0.70 (spans 0.5-0.9) vs 0.17. Targets, in the hat frame:
- spectacles: rims at (+-0.27, -0.42, 0.27), yawed outward +-0.5 rad (surface slope -0.6/unit x); bridge z 0.37 at x 0. Keep rim size (they read well).
- goggles: rim centres z 0.21, lenses z 0.25 at x +-0.24, y -0.2, yaw +-0.35.
- headlamp: lamp centre z 0.22 (cylinder 0.18 long, spans 0.13-0.31), lens z 0.33.
- cap: brim centre z 0.38 (spans 0.18-0.58), tilt 0.15 rad down; dome scale z 0.75 centred z -0.12.
- straps (goggles, headlamp): make them an ellipse, not a circle: radius 0.64, scale z 0.62, centre z -0.15 (front 0.25, back -0.55; head spans -0.55..0.24 at rel y -0.2). Today the circular r0.58 strap is 0.34 off the forehead and pierces nothing at the back.
- all other headgear (toque, douli, beret, headphones): shift -0.15 in z so it sits over the head, not over the nose. The toque band seats fine in height (head top -0.05 at z 0 vs band bottom -0.1).

## Medium findings

- **M1. Cream teacup and plate on white fur (confirmed).** Contrast of cream #f4ecd8: vs black fur 14.8:1, vs lit-white fur #f2efe8 1.03:1, vs shaded belly (#b9b6ae, what renders) 1.72:1. They read only when backed by the black arm or sky (sheetP2: cup/plate are visible against the arm, vanish against the belly). Fix: move the prop 0.15-0.2 outward from the belly (L +x, R -x) so the front view sees it past the body line, and add an ink rim: cup rim torus r0.16 tube 0.02 ink, plate dish rim ink 0.03 high. Do not change the cream.
- **M2. Scarf vs fur contrast (spec test: >= 3:1 against both fur tones).** Light theme vs black fur #1a1a1a: pass 2.41, steamers 2.52, tea 2.78, pantry 2.68, front-of-house 2.68 (all < 3; vs white 5.5-6.3 fine). Dark theme vs white #f2efe8: pass 1.82, steamers 1.76, tea 1.66, pantry 1.67, front-of-house 1.70 (all < 3; vs black 8.4-9.2 fine). A single colour can reach ~3.9 vs both, but these are the UI surface hues. They stay readable (see wide_dark crops) and the scarf is not the role cue, so I flag rather than bounce: either accept as is, or give the scarf a darker light-theme tone (L ~ +8%) and a lighter dark-theme tone. User call.
- **M3. Developer headphones band is ink on black ear fur** (sheetA developer_front): the band loses its outline against the ears. Raise the band 0.05 or use a mid-grey #3a3d42 for the band only.

## Low findings

- L1. Developer tablet result lines are both ink (headgear.mjs:134-135); the user verdict says red "N failed" / green "N passed" lines. Use a semantic red and green, not station hues.
- L2. Scarf tail box clips into the belly: the lower edge is cut diagonally with a hairline below it (sheetF). Guess at the fix: move the tail forward (z 0.50 to ~0.56) or shorten it; check in a render.
- L3. Headlamp: the "headlamp:over" box (1.0 long, 0.08 wide) shows from the front as an antenna above the lamp (cropL1, last tile). Drop it or flatten it to follow the crown (y -0.05 at z -0.2).
- L4. The debugger stands in the cub row at the front. It showed at 2300x1250 and 1440x1300; I did not check whether it is on screen at 1440x900. Not a gear issue, noting it for the layout.

## Checks that passed

- Scarf size: fine (the collar reads at Level 1 and in 3/4 and does not hide the face or arms; no change).
- Reduced motion: headgear is rigid on its sockets; no errors, no extra motion (checked 390x844 dark + reduced motion).
- Theme swap: scarf, toque band, cap, beret change hue; neutrals fixed; dark theme loads with no console errors.
- Scout carries no lantern; unknown-role handling not rendered (test covers).
- Mobile (390x844): the pandas are tiny (about 25 css px) and only a slice of the den shows; goggles, spectacles, headphones and the scarf hue were still visible in the screenshot. No new finding.

## Check first (round 2)

the product and architect pair at Level 1 (they must differ in the front view without the prop), and a front-row kiosk panda with the douli must show its hat under the noren at 1440x900.
