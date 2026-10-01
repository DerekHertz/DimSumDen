# 10: Fit the default camera so every stall shows at phone width

**Type:** feature

**Priority:** P2

**Blocked by:** 03

**Status:** ready-for-agent

**Design refs:** `docs/design/den-map.md` (coordinates, constants, checks). Found by designer review on 03 (PR 110), out of scope there.

## What to build

At 375px viewport width the default camera crops the side stalls of the horseshoe. Fit the default framing to the viewport's aspect ratio so every kiosk is fully in view at phone width, without changing the desktop framing.

**Files:** the camera setup in `apps/ui/src/scene/` (wherever the default camera position and fov are set), plus a test.

## Acceptance criteria

- [ ] At 375×812, every kiosk's bounds project inside the viewport at the default camera (unit test on the framing function)
- [ ] Framing at 1440×900 is unchanged (test)
- [ ] Resizing between phone and desktop widths re-fits the camera
- [ ] User visual verdict at 375px

## Comments

- **orchestrator, 2026-10-01:** Filed on the user's yes (2026-10-01) from the designer's out-of-scope finding on 03.
