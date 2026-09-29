# 01: Banquet market layout in the scene

**Type:** feature

**Priority:** P0

**What to build:** Rearrange the Level 1 scene in apps/ui into the banquet market (ADR 0013; mockup boards "Level 1" and "Banquet market" on the canvas). Bao is larger and sits at the back behind a round banquet table. A lazy susan on the table holds one steamer basket per ready ticket (the frontier). Four stalls around the table, built from simple geometry (box booth, cone or hip roof in panda-ink, station-hue trim): Steamers back-left, Front of House back-right, Tea front-left, Pantry front-right. A cub basket front centre. Cells are placed by station: orchestrator on Bao's crown, product left shoulder, architect right shoulder; developer, scout, debugger in Steamers; qa in Tea; security in Pantry; designer in Front of House. Stall slots are fixed anchors in a pure placement module; a stall with more cells than slots widens its slots along its front. Low animation is fine. For the showcase this ticket makes the placement call ticket character-animation/14 would make; record it in ADR 0013.

**Blocked by:** None

**Status:** in-review

- [ ] A pure placement module maps cell type and slot index to a position, with unit tests for every station, the Pass perches, and overflow widening
- [ ] Lazy susan shows one basket per frontier ticket and updates live
- [ ] Stalls, table, cub basket and Bao at the new position render with no console errors (smoke:ui passes)
- [ ] ADR 0013 records the anchor model and moves to accepted

## Comments
- **Showcase sprint (user, 2026-09-29):** ship a demoable v1 tonight. Relay is developer then qa verify; risk-check decides security. Mockups: https://claude.ai/artifact/LQjpimx1jfX5bjZEoTo3za
- **Environment (user, 2026-09-29):** cloud Chromium 1194 does not match Playwright 1243, so smoke:ui cannot run in the cloud session. Agreed fix: the user runs the browser verification in WSL. qa verify here covers unit tests and build; browser check is the user's.
- **User browser check (WSL, 2026-09-29):** layout works. Fix round asks: (1) the banquet table reads as a bucket (tapered bowl); make it a larger, flat round tabletop on a short base or legs, with the lazy susan a thin disc on top; (2) add camera controls: horizontal pan (x only) by drag and arrow keys, and zoom by wheel or +/- within limits, so cells at the back stalls can be seen; keyboard reachable, respects reduced motion (no easing).
