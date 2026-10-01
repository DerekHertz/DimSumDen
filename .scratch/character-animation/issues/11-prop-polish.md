# 11: Prop polish follow-ups from ticket 07

**Type:** task

**Priority:** P2

**What to build:** The findings from ticket 07 that the user waived so it could merge (`handoffs/07-designer-3.md`):
- **MEDIUM:** the blueprint reads as a card. Make it a landscape sheet 0.34-0.38 wide and 0.24-0.30 tall (`BLUEPRINT_W`, `BLUEPRINT_H` in `build_props.py`), tighten its placement test, and re-export in Blender.
- **Environment:** `dev-scene.mjs` sizes its renderer on the first frame, not only at load and on resize, so a newly opened Browser pane doesn't render an empty canvas.
- **Optional LOWs:** end knobs on the scroll; a grip for the empty right paw in `blueprint_unroll`; the fan covering the cheek from the near three-quarter view.

**Priority:** P3

**Blocked by:** 07

**Status:** resolved

- [ ] The blueprint meets the size targets, and all placement tests pass
- [ ] dev-scene renders on the first load of a newly opened Browser pane
- [ ] Designer critique finds no HIGH or MEDIUM

## Comments

- **Created (orchestrator, 2026-09-27):** Split from ticket 07 at the user's request. It's low priority: animation polish waits until the organism loop and the office MVP are up.
- **orchestrator, 2026-09-30:** Design sweep (designer, user-approved 2026-09-30): SUPERSEDED by den-scene-v1/09 (blueprint prop replaced by order slips). Dev-scene first-frame resize fix split to its own ticket.
- **orchestrator, 2026-09-30:** superseded by den-scene-v1/09
