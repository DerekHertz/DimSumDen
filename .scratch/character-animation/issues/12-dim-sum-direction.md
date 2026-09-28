# 12: Visual direction: a dim sum restaurant in a bamboo forest, and a new name

**Type:** design-direction

**What to build:** A direction brief (no assets, no code) that re-themes the office around Bao as a dim sum restaurant in a bamboo forest:
1. **Setting:** the kitchen/dining layout. Map the organs onto the places, for example the Brain as the head chef's pass, Muscles at the steamers and prep stations, Immune as the tasters or the tea master, and Skin as the front of house. Place the boards (issues, PRs, queue) as order tickets or menu boards.
2. **Tool-call animations, re-themed for Bao:** read, edit, test/build, web search, fail twice, waiting on the user, done, and the merge celebration. For example, done might become a steamer lid lifting with a puff of steam instead of confetti, and merge might ring a restaurant bell instead of a gong.
3. **Name:** 5-8 dim-sum-themed names for the office, each with a one-line rationale and a check that it doesn't clash with an obvious existing product. Also consider the "Agent Office" overlap with AgentSystemLabs/agent-office.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] The brief covers setting, organ-to-place mapping, the animation list and the name shortlist, and stays consistent with the existing Bao/panda design system (`design-artifacts` memory, `design/`)
- [ ] It fits the performance and style limits the character-animation tickets already set (30 cells, plush look, ticket 10)
- [ ] The rename is proposed, not applied. Changing `CONTEXT.md`, `CLAUDE.md` or the repo name is a brain gate for the user
- [ ] It lists which existing character-animation tickets (04-11) change, and how

## Comments

- **Created (orchestrator, 2026-09-28):** At the user's request. The tool-call animation list comes from `.scratch/_handoffs/refs/agentsystemlabs-agent-office.md`.
- **unknown, 2026-09-28:** User decisions (2026-09-28): (1) Bao IS the restaurant; ticket 05 perches stay. (2) Name: Dim Sum Den, pending a scout clash check; the rename (CONTEXT.md, CLAUDE.md, repo) is not applied yet and stays a brain gate. (3) Keep the traditional Chinese elements: the scroll, traditional hats, touches from the dynastic eras. Don't swap to purely kitchen props; blend them with the kitchen ones. (4) The merge bell makes a sound (off by default). (5) Tool-call sub-states under working get their own ticket (character-animation/13).
- **unknown, 2026-09-28:** Clarified (user, 2026-09-28): developer cells stay modern (a laptop, a modern look, no dynastic props). The traditional Chinese elements (scroll, hats, dynastic touches) go to the other cells. Kitchen actions like pleating can still apply, but with a modern style.
- **unknown, 2026-09-28:** Name check (scout, 2026-09-28): Dim Sum Den is clear. The npm name dim-sum-den is free, no GitHub repo has it, and no software or trademark clash turned up; only restaurant names. The rename is not applied: that still needs the user's yes for CONTEXT.md, CLAUDE.md and the repo.
- **unknown, 2026-09-28:** Signed off (user, 2026-09-28): the brief looks good.
