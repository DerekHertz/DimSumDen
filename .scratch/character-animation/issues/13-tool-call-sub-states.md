# 13: Cells act out their latest tool call (sub-states under `working`)

**Type:** feature

**Priority:** P2

**What to build:** Under the `working` state from ticket 04, a cell plays a clip for its latest tool call: read, edit, test/build, and web search. It also plays the failed-twice, waiting-on-user and done clips, and the merge bell. The clips and reduced-motion holds are in `.scratch/character-animation/design/dim-sum-direction.md` section 2. Events come from tailing the Claude Code session transcripts (decided in ticket 11's Comments), not from hooks.

**Priority:** P3

**Blocked by:** character-animation/04, organism-infra/11

**Status:** ready-for-agent

- [ ] Each tool-call kind maps to its clip, and an unknown tool falls back to the generic `working` clip
- [ ] Failed twice, waiting and done play their Bao clips; the merge rings the pass bell, with sound off by default, and nearby cells bow
- [ ] Reduced motion shows the held poses
- [ ] Steam uses one shared sprite pool of at most 4, inside ticket 10's 30-cell budget
- [ ] Props blend the kitchen with traditional Chinese elements: the scroll, traditional hats, dynastic-era touches (user, 2026-09-28)

## Comments

- **Created (orchestrator, 2026-09-28):** The user chose a separate ticket over folding this into 04. `designer` runs `spec` mode before the relay.
- **unknown, 2026-09-28:** Clarified (user, 2026-09-28): developer cells stay modern (a laptop, a modern look, no dynastic props). The traditional Chinese elements (scroll, hats, dynastic touches) go to the other cells. Kitchen actions like pleating can still apply, but with a modern style.
