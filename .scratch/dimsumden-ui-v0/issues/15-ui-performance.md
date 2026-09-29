# 15: UI performance: profile and fix the slow page

**Type:** feature

**Priority:** P1

**What to build:** The user reports the page is slow with the live board (12 plushes). Profile first (frame time, GPU, draw calls, JS per frame). Then fix the biggest cost. Suspects, unverified: each plush loads or clones its furry glb separately; `stackChips` and projection run on every frame; shadows and fur shells.

**Blocked by:** 13

**Status:** resolved

- [ ] Profile numbers recorded in the handoff, before and after
- [ ] Steady frame rate on the live board, with the target agreed with the user in the handoff
- [ ] No visual regression (user verdict)

## Comments

- **Created (orchestrator, 2026-09-29):** User: "the page is pretty slow". Runs after 13.
- **developer, 2026-09-29:** Developer: plush LOD + prop cache, 1.9M -> 0.43M tris/frame; target proposal and visual checks in handoffs/15-developer.md
- **User verdict (orchestrator, 2026-09-29):** Visual review passed ("looks good"). User watches in Windows Chrome/Edge (GPU); target agreed: 60 fps with 12 plushes in a hardware-accelerated browser.
- **qa, 2026-09-29:** QA pass: 662 tests pass, 0 skipped; smoke:ui passes; 60 fps unmeasured here (no GPU), triangle budget test covers proxy. See handoffs/15-qa-verify.md
