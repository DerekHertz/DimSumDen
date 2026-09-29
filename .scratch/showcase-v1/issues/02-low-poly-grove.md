# 02: Low-poly green bamboo grove

**Type:** feature

**Priority:** P0

**What to build:** Replace the paper-cut backdrop with a moderately geometric 3D grove (mockup "Level 1"): instanced bamboo stalks (cylinders with node rings) in far, mid and near layers, simple leaf clusters, a leafy mound behind Bao, a grass ground plane with a few tufts, soft fog for depth. Colours from the grove-* tokens (grove-mist #e3efd6, grove-far #b7d39d, grove-mid #7fae62, grove-hill #8cc070, grove-grass #9fcc80, grove-near #4f8a3c). Static or swaying no faster than dur-breath (2800ms); still under prefers-reduced-motion.

**Blocked by:** None

**Status:** in-review

- [ ] Grove geometry is instanced; a unit test covers the layout generator (deterministic seed, counts per layer)
- [ ] Scene still meets the existing frame budget with 30 cells (plush LOD from dimsumden-ui-v0/15)
- [ ] No console errors; smoke:ui passes

## Comments
- **Showcase sprint (user, 2026-09-29):** ship a demoable v1 tonight. Relay is developer then qa verify; risk-check decides security. Mockups: https://claude.ai/artifact/LQjpimx1jfX5bjZEoTo3za
- **User browser check (2026-09-29):** grove is great. Asks folded into the batch: slower bamboo sway; front stalls a little closer to the table; extend pan so the Steamers stall's end is reachable.
- **User (2026-09-29):** front Tea stall hides the back Steamers cells; raise back stalls or lower front roofs and stagger. Sent to the batch developer.
