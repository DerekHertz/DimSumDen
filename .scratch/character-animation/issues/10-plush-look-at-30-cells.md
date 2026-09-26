# 10: Plush look at 30 cells

**What to build:** The plush look (fuzzy, soft, no ink outlines) holds in the browser with 30 cells. It uses baked fuzz in the textures plus a rim-light shader, with no fur shells in the web build. Distant cells follow the update policy from 02's ADR.

**Blocked by:** 02, 04

**Status:** ready-for-agent

- [ ] Baked fuzz textures and rim-light shader applied to Bao and cells
- [ ] The distant-cell update policy from 02's ADR is implemented and tested at the director seam
- [ ] A 30-cell scene holds the target frame rate (recorded in the handoff with how it was measured)
- [ ] The user confirms the look matches the renders (`ready-for-human` step)

## Comments
