# 11: Bigger, cuter Bao with the Pass pandas seated on him

**Type:** feature

**Priority:** P2

**Design refs:** the user's screenshot `.scratch/den-scene-v1/refs/bao-perched-pass-2026-10-01.png`. Design system https://claude.ai/artifact/SCTwbsRq3wEcoYbiYYUUK7, frames https://claude.ai/artifact/AFEGyVKV5s6GbTFraA5U3G.

**What to build:** User notes (2026-10-01): "bao should be bigger and cuter! the two pandas on his shoulders are just floating there but he can also be larger."

- Scale Bao up so he clearly anchors the den. Placement and the layout constants live in `banquet-layout.mjs` and `grove-layout.mjs`. Keep the table, the Tally and the kiosks clear of him at 1440×900, and keep the 375px fit from den-scene-v1/10 in mind.
- Make him cuter. The designer runs a direction pass first, with renders of 2–3 options for the user to pick from: a bigger head-to-body ratio, rounder cheeks and ears, softer eye patches, and maybe a small smile. Proportion changes that need the rig or glb are flagged in the direction, not improvised in code.
- Seat the Pass pandas on Bao. Today the orchestrator sits on his head and product and architect on his shoulders, and they float above the surface. Each perched panda's seat must touch Bao's surface (head top, left shoulder, right shoulder) at every scale and through Bao's idle motion.

**Blocked by:** 09 (headgear sits on these pandas; build after its round 2 merges)

**Status:** ready-for-agent

- [ ] The designer's direction is picked by the user before the build
- [ ] Bao's scale matches the picked direction, and nothing overlaps him at 1440×900 (placement test)
- [ ] Each perched Pass panda's lowest point is within 0.02 of Bao's surface at its perch, at rest and at the extremes of Bao's idle clip (test)
- [ ] User visual verdict

## Comments

- **Created (orchestrator, 2026-10-01):** From the user's notes and screenshot after looking at 09 at 030c706.
