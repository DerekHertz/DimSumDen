# 03: Selected-panda card and the kiosk selection ring

**Type:** feature

**Priority:** P1

**Blocked by:** 02, den-scene-v1/07

**Status:** closed

**Design refs:** `docs/design/2026-10-01-iso-den.md` (card fields, ring and badge numbers; written by 01), `.scratch/den-iso-v1/spec.md`.

## What to build

Clicking a kiosk or a panda selects it. A card floats on the left: the panda's portrait, role and station, status (running, waiting, failed with a reason), cell type and ticket, the current order, cost against its limit, a short live feed, and Retry and Zoom to panda buttons. The selected kiosk gets a dashed ring and a failure or activity badge in the scene. Selecting nothing hides the card. Reduced motion shows the end state with no slide.

A card model takes the selected panda from the scene state and returns the card's fields. Cards are DOM, so the model is tested in node and the ring's position uses the projection module from 02.

**Files:** `apps/ui/src/` (a new selected-card model and component beside the panel components from 07), `apps/ui/src/scene/Den.jsx` and `Market.jsx` for the ring and badges, and their tests.

## Acceptance criteria

- [ ] The card model returns the right fields for a running, a waiting and a failed panda, and nothing for no selection (pure test)
- [ ] Clicking a kiosk or panda selects it and shows its card; clicking empty ground clears it (one `smoke:ui` test)
- [ ] The dashed ring sits on the selected kiosk, with a failure badge for failed and an activity badge for running (test on the layout/ring positions)
- [ ] Retry and Zoom to panda are real buttons, reachable by Tab, with visible focus
- [ ] Labels use den words only; no biology word appears in a label or `aria-label`
- [ ] Reduced motion and both themes are covered by a test or the designer's spec
- [ ] The user inspects it in the browser (visual verdict)

## Comments
- **orchestrator, 2026-10-01:** Scope added (user, 2026-10-01): a kiosk click selects that kiosk's most urgent panda (digest D3). Heading 0 and mirrored kiosk yaw confirmed.
- **orchestrator, 2026-10-03:** Closed: folded into the den-v1 spec (refocus, docs/refocus/triage-2026-10-02.md)
