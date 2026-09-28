# 04: One cell shows its state

**What to build:** A cell in the scene shows its state through body language. The character director (a pure module per 02's ADR) maps each of the 8 states (idle, working, waiting_on_user, blocked, done, failed, throttled, terminated) to a looping clip, an entry one-shot, a face frame, and a held pose for reduced motion. State changes cross-fade immediately (`dur-fast`), even mid one-shot. The director is wired into the scene, where a mock state source or dev control switches one cell's state. The state's icon and word are shown alongside the pose.

**Blocked by:** 03

**Status:** resolved

- [x] Director tests cover every state's loop, entry one-shot, face frame and held pose
- [x] Director tests cover immediate interrupts and the calm rule (no loop, blink or glance spaced shorter than `dur-heartbeat`)
- [x] With reduced motion, every state shows its held pose and face frame, with no loops, breathing or blinks
- [x] In the running scene, switching state on one cell visibly changes pose and expression
- [x] State is also shown by icon and word, never by motion alone

## Comments

- WIP, paused for a usage-limit wrap-up (branch `worktree-agent-a919cafc1cb3eea97`, commit `9d15b01`). Done: `packages/character-director` (state-to-clip/face/held-pose map for all 8 states, immediate interrupts, calm-rule blink scheduling, reduced-motion, mock StateSource; 21/21 node:test pass) and `apps/ui/src/scene/dev-scene.{html,mjs}` (three.js dev scene via CDN import map, no new dependency, with per-state buttons, reduced-motion toggle, icon+word badge). Left: /code-review pass, browser verification that switching state visibly changes pose/expression, and a sanity check of STATE_MAP choices against spec.md per-state stories. See handoff .scratch/character-animation/handoffs/04-developer.md.
- Resolved 2026-09-26 on branch `claude/remote-control-c0e546` (commits `ca2b283` `16dc402` and `f901662`, built on `9d15b01` and `a83baee`). The code review and the browser check are done. Fixes: pose clips are held rather than looped, terminated waves once, and reduced motion no longer blends a stale pose. Idle keeps `half_lidded` (the user's choice). An emote bubble with grove-themed line icons now floats above the panda. 23/23 tests pass. The branch isn't merged to main yet. See handoffs/04-developer.md.
- **unknown, 2026-09-28:** Input (user, 2026-09-28): cells act out their latest tool call (read, edit, test, web, fail-twice, waiting, done), driven by transcript tailing. See .scratch/_handoffs/refs/agentsystemlabs-agent-office.md (user, 2026-09-28).
