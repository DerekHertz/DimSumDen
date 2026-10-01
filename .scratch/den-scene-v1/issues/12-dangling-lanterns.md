# 12: Dangling paper lanterns on the kiosks

**Type:** feature

**Priority:** P2

**Design refs:** the user's inspiration `.scratch/den-scene-v1/refs/lantern-stall-inspo.png` (the user likes the dangling ones). Design system https://claude.ai/artifact/SCTwbsRq3wEcoYbiYYUUK7, frames https://claude.ai/artifact/AFEGyVKV5s6GbTFraA5U3G.

**What to build:** User notes (2026-10-01): "the lanterns aren't really giving lanterns, more like black boxes." 03 gave each kiosk one lantern at the front eave corner, unlit in `surface-200`. At Level 1 it reads as a dark box.

- Rebuild the kiosk lantern procedurally (like `kiosk.mjs` and `stall-roof.mjs`): a rounded, ribbed paper body (lathe), a dark top and bottom cap, a short tassel, and a cord so it hangs from the eave.
- Several lanterns per kiosk, dangling at different heights along the front eave. The designer decides how many, in a spec, inside the triangle budget.
- A gentle sway, off under reduced motion.
- Keep 03's meaning: a lantern lights in `lantern-fill` (emissive) only when a panda at that station is `waiting_on_user`. The designer decides with the user whether the other lanterns glow softly as decoration, or whether only one lantern carries the waiting signal.
- No black: unlit lanterns use the warm paper tones from the design system.

**Blocked by:** none for the spec; the build follows 09, since both touch `kiosk.mjs`

**Status:** ready-for-agent

- [ ] Designer spec, with the lit-state question settled with the user
- [ ] Each kiosk has the specified number of lanterns hanging from its eave by a cord, and none uses a near-black material (test)
- [ ] The waiting-on-user lighting from 03 still holds (state test)
- [ ] Sway stops under reduced motion (test)
- [ ] User visual verdict

## Comments

- **Created (orchestrator, 2026-10-01):** From the user's notes and inspiration image after looking at 09 at 030c706.
- **orchestrator, 2026-10-01:** User decision on the lit state (2026-10-01): all lanterns glow softly as ambient decoration. The lantern no longer carries the waiting_on_user signal; that replaces 03's lit-lantern rule and its state test (update both, and den-map.md's Lantern row). The designer proposes another in-scene cue that a panda needs the user, in the spec, for the user to pick; the 07 'Needs you' card and the '· waiting' pills stay.
