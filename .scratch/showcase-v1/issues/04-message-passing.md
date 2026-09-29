# 04: Message passing on the lazy susan

**Type:** feature

**Priority:** P0

**What to build:** Show work moving between stations. The bridge sends ticket change events; derive a handoff when a ticket's active cell type (and so its station) changes, e.g. qa specify to developer. On a handoff, that ticket's basket on the lazy susan turns from the old stall to the new one over dur-slow, the sender plays its point pose if available, and the receiver gets a heart bubble. When any cell is waiting_on_user, its stall's roof lantern lights (lantern token) and the service bell on Bao's crown glows. Reduced motion: the basket jumps, no turn.

**Blocked by:** 01

**Status:** in-review

- [ ] A pure handoff-derivation module (previous state, next state -> handoff list) with unit tests: station change, same-station change, new ticket, resolved ticket
- [ ] Lazy susan turn and lantern or bell lighting driven by live events; a dev-scene fixture demonstrates a handoff
- [ ] smoke:ui passes

## Comments
- **Showcase sprint (user, 2026-09-29):** ship a demoable v1 tonight. Relay is developer then qa verify; risk-check decides security. Mockups: https://claude.ai/artifact/LQjpimx1jfX5bjZEoTo3za
- **User (2026-09-29):** queued tickets show only as baskets on the lazy susan; a panda appears only once a cell picks the ticket up.
- **Batch (orchestrator, 2026-09-29):** also raise the camera pan limit so an 8-cell stall's outer edge (|x| 9.3) can be reached.
- **qa, 2026-09-29:** QA pass on unit tests and build. Needs user eye: turn, heart, lantern, bell (?demo=handoff). dur-slow 700 ms is invented, confirm. smoke-ui chip count 6 to 3 justified, unrun.
