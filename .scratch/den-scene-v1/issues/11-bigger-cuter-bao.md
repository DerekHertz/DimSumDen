# 11: Bigger, cuter Bao with the Pass pandas seated on him

**Type:** feature

**Priority:** P2

**Design refs:** the user's screenshot `.scratch/den-scene-v1/refs/bao-perched-pass-2026-10-01.png`. Design system https://claude.ai/artifact/SCTwbsRq3wEcoYbiYYUUK7, frames https://claude.ai/artifact/AFEGyVKV5s6GbTFraA5U3G.

**What to build:** User notes (2026-10-01): "bao should be bigger and cuter! the two pandas on his shoulders are just floating there but he can also be larger."

- Scale Bao up so he clearly anchors the den. Placement and the layout constants live in `banquet-layout.mjs` and `grove-layout.mjs`. Keep the table, the Tally and the kiosks clear of him at 1440×900, and keep the 375px fit from den-scene-v1/10 in mind.
- Make him cuter. The designer runs a direction pass first, with renders of 2–3 options for the user to pick from: a bigger head-to-body ratio, rounder cheeks and ears, softer eye patches, and maybe a small smile. Proportion changes that need the rig or glb are flagged in the direction, not improvised in code.
- Seat the Pass pandas on Bao. Today the orchestrator sits on his head and product and architect on his shoulders, and they float above the surface. Each perched panda's seat must touch Bao's surface (head top, left shoulder, right shoulder) at every scale and through Bao's idle motion.

**Blocked by:** 09 (headgear sits on these pandas; build after its round 2 merges)

**Status:** resolved

- [ ] The designer's direction is picked by the user before the build
- [ ] Bao's scale matches the picked direction, and nothing overlaps him at 1440×900 (placement test)
- [ ] Each perched Pass panda's lowest point is within 0.02 of Bao's surface at its perch, at rest and at the extremes of Bao's idle clip (test)
- [ ] User visual verdict

## Comments

- **Created (orchestrator, 2026-10-01):** From the user's notes and screenshot after looking at 09 at 030c706.
- **orchestrator, 2026-10-02 (scoped with the user):** Main goal: Bao about 1.5x larger and the Pass pandas seated on him, not floating. Cuteness is code-only (proportions via transforms and materials, plus the scale); no glb or rig edits, none of the Blender work. Designer direction step is renders only (2-3 options against the resynced design system), user picks, then one build and the user's visual verdict. 09 resolved, so this is unblocked. Dispatch after 119 resolves.
- **designer, 2026-10-02:** Designer direction (2026-10-02): three renders-only options at Bao 2.1x, in the real den. A Steady host (sleepy face, head x1.12, pandas on crown and shoulders), B Soft bun (head x1.2, smile frame, softer patches, crown and shoulders), C Mochi bun (head as wide as the body, round eyes, blush, side pandas ride the ears because the head covers the shoulders). Awaiting the user's pick. Page: https://claude.ai/artifact/MyJvqgyB5A4h4qq7DUUUYc. Renders: .scratch/den-scene-v1/refs/direction-11/. Detail: handoffs/11-designer-direction.md.
- **designer, 2026-10-02:** direction awaits the user's pick of A, B or C
- **orchestrator, 2026-10-02:** User picked option B (Soft bun) from designer direction (handoffs/11-designer-direction.md). Eye-patch overlay and a fully three.js panda deferred; revisit later.
- **designer, 2026-10-02:** Designer UI spec for B (Soft bun) done: scale 2.1, kiosks +-3.6, pads +-3.4, camera TARGET z -2.9 (hat headroom), pose table, content_squint face, bone-anchored Pass seats (within 0.02 at sit_still and breathe), states, a11y, T1-T14 for qa. Scope added for qa: handoff arc radius >= 6.1, pad and TARGET moves, extra-slot seats. Detail: handoffs/11-designer-spec.md
- **designer, 2026-10-02:** UI spec for option B done; next is qa specify
- **qa, 2026-10-02:** partial: context over 80k, WIP commit 0802dfe, see handoffs/11-qa-specify.md
- **designer, 2026-10-02:** Spec amended (handoff 11-designer-spec-2.md, Amendment 1): Tea and Pantry x +-5.2, pad z -7.65, grove test replaced by T8. Resolves the three qa specify conflicts.
- **developer, 2026-10-02:** Wiring done; T5 chips test unfixable from source, see handoff
- **designer, 2026-10-02:** Design pass (partial, nits only): R1 ordering measured OK, R2 seated, pills on floor; PAD_CHIP_Y -0.05 committed (qa: PILL.y -0.05). Unchecked: 375 kiosk margin, grove R8, near-band arc, a11y. See 11-designer-review.md.
- **qa, 2026-10-02:** QA pass. Scene 500/500, npm test 1939/1939, 0 skipped. T5 literal synced to -0.05 (e865db4). Kiosk margin 2.17 px at 375. Unverified: tufts under Bao, handoff arc by near stalk, 375 chip clip (pre-existing). See 11-qa-verify.md.
