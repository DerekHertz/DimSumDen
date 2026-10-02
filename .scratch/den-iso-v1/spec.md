# Den iso v1: the isometric den with floating cards

Status: ready-for-agent (spec); tickets not yet published (needs the user's approval of the breakdown).

Design source: the "Agent Office Zoom Frames" canvas, artboard `Level1-Den-Iso.dc.html`, "Level 1 · Den (isometric, floating cards, dev-03 selected)" (https://claude.ai/artifact/AFEGyVKV5s6GbTFraA5U3G). The frame is hand-drawn SVG: its screen coordinates are a visual target, not a 3D spec. The designer's digest (ticket 01) turns it into numbers, and every later cell reads the digest, never the canvas. Layout decisions of 09-29 (`docs/design/den-map.md`) stand unless the digest says otherwise.

## Problem Statement

The user reviewed the Level 1 frames and drew a new target: an isometric view of the den with floating cards instead of a fixed sidebar. The running app shows the den with a tilted perspective camera and a 400px right sidebar, so it does not look like the target.

## Solution

The den is drawn with an orthographic camera at a fixed isometric yaw and pitch, so kiosks, Bao, the lazy susan and the tally keep the frame's flat, even look at every zoom. The sidebar is replaced by floating cards over the scene: a card for the selected panda on the left, "Needs you" and "Stations & queue" cards on the right, and a logo pill top-left. The zoom switcher, intent bar and timeline keep their bottom positions. The scene gains the frame's dressing: a ring of stepping stones around Bao, dormant pads for roles not yet online (Library, Drum), bamboo borders, and a selection treatment on the chosen kiosk.

## User Stories

1. As the user, I want the den to look like the isometric frame, so that what I see matches what I approved.
2. As the user, I want every kiosk drawn at the same scale regardless of distance, so that the back row doesn't look smaller than the front row.
3. As the user, I want wheel zoom and pan to keep working on the isometric camera, so that I can still explore the den.
4. As the user, I want the whole den in view at the default zoom on a 1440x900 window, so that I see every station at once.
5. As the user, I want the den to fit a 375px-wide phone screen, so that I can check it on my phone. (Replaces ticket den-scene-v1/10.)
6. As the user, I want to click a kiosk or panda and see a card for it on the left, so that I can read its status without leaving the den.
7. As the user, I want the selected card to show the panda's role and station, status, current order, cost against its limit and a short live feed, so that I know what it is doing.
8. As the user, I want Retry and Zoom to panda buttons on the card, so that I can act on a failed panda.
9. As the user, I want the selected kiosk marked with a dashed ring and a failure or activity badge, so that I can find it in the scene.
10. As the user, I want a "Needs you" card on the right listing every waiting gate with Approve and Deny, so that nothing waits unnoticed.
11. As the user, I want a "Stations & queue" card with pill counts per station and the next tickets on the susan, so that I can see the queue without a sidebar.
12. As the user, I want the cards to be collapsible, so that they don't cover the scene when I don't need them.
13. As the user, I want a logo pill with a Live badge top-left, so that I know the den is connected.
14. As the user, I want the stepping-stone ring, bamboo and dormant pads, so that the den reads as the plush grove I designed.
15. As a keyboard user, I want every card control reachable by Tab, with visible focus, so that I can use the den without a mouse.
16. As a screen-reader user, I want cards labelled in den words (panda, role, Needs you), with no biology terms, so that the labels match the glossary.
17. As the user, I want reduced motion respected on the new selection and card transitions, so that nothing slides when I have asked for stillness.
18. As the orchestrator, I want Gate requests from the Needs you card to keep filing through the bridge as they do now, so that the relay is unchanged.

## Implementation Decisions

- **Projection.** A pure projection module owns the isometric math: the camera's yaw and pitch, orthographic zoom range, world-to-screen and screen-to-world conversion, and pan limits. The R3F scene consumes it; the camera rig stops owning projection math. Exact angles, zoom range and default framing come from the designer's digest. True orthographic, not a tilted perspective camera (user, 2026-10-01).
- **Layout.** Placement constants stay in the existing layout module. Positions move only within the ±0.3 tolerance of `den-map.md` unless the digest justifies more. Scene dressing (stones, pads, bamboo) is placed by the same layout module so the checks in den-map keep working.
- **Cards.** The sidebar's data models are reused. A new selected-panda card model takes a panda from the scene state; the Needs you and Stations & queue cards reuse the gates and queue models. Cards are DOM, positioned by screen edge, not anchored to scene objects (the frame draws no leader lines).
- **Ticket 07 is re-scoped** to the cards, logo pill and kept bottom chrome. **Ticket 10 is retired**: its phone-width fit becomes part of the camera ticket (user, 2026-10-01).
- **Tickets 04, 06, 08, 12** are independent of the projection. 06 and 11 touch the layout constants and run after the camera ticket.
- **Words.** All new labels use the UI names in `CONTEXT.md`; none of the biology words appear in any visible label or `aria-label`.
- **Design system.** The frame uses hex values; the digest maps each to an existing token name and lists any gaps. A token that ships in code needs the designer's gate and the user's approval.

## Testing Decisions

- A good test checks external behaviour: where a world point lands on screen, which cards render for a given state, what a click selects. It never checks internals.
- **Seam 1, the projection module:** node tests for round-trip world to screen to world, zoom and pan clamps, and the default frame containing every kiosk at 1440x900 and 375x667. Prior art: `camera-rig.test.mjs`, `default-framing.test.mjs`.
- **Seam 2, the card models:** node tests for each model's output from fixture state (selected panda, empty, failed, waiting gates). Prior art: `gates-model.test.mjs`, `queue-model.test.mjs`, `usage-meter-model.test.mjs`.
- **Seam 3, the browser:** `smoke:ui` extended to select a kiosk and see its card. Keep browser tests few and one page per file; ticket 94 is investigating why they flake in CI.
- Scene dressing is placed by the layout module and tested there (counts and positions); how it looks is the user's visual verdict, as for tickets 05 and 09.

## Out of Scope

- The other zoom levels (2 Station, 3 Panda, 4 Workspace) and their frames.
- True 3D rework of the characters or kiosks, new roles' pandas (Library and Drum stay dormant pads).
- Changes to the bridge, the board or gate request handling.
- The lazy susan's two-tier behaviour (ticket 04) and the tally (resolved, 05).

## Further Notes

- The designer genome links the zoom-frames artifact `JsxZ5Vj7DxJQbekA2Ehoot`; the frame with this design lives in the copy `AFEGyVKV5s6GbTFraA5U3G`. Pointing the genome at the right one is a `.claude/` edit, so the user's call.
- Token plan: ticket 01 writes the digest to `docs/design/` (a short numeric page). Developers read the digest and the ticket, never the 52 KB canvas.
