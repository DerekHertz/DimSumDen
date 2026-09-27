# Handoff: organism setup session (2026-09-26)

**Paused at 84% of the 5-hour limit.** Resume after the reset.

## Waiting on the user
- **PR #6** (branch `claude/orchestrator-agent-setup-d75ece`) needs review and merge. Then pull `main` so these tickets reach the board: `ci-cd/01`, `ci-cd/02`, `organism-infra/01–03`.
  - It adds the `qa`, `security`, `designer` and `debugger` genomes.
  - It adds the code relay and the `in-review` status.
  - It adds the orchestrator's version-control rules, the `usage-watch` skill, and environment-issue reporting.

## In flight
- **Ticket 07** (`character-animation/issues/07`): `ready-for-agent`, fix round 3 agreed (see its Comments). The latest branch is `worktree-agent-a926ab2096132ef97`.
- **Fur look (Muse-style):** the user approved the hybrid approach: fur shells on Bao and close-up cells, baked fuzz plus `sheen` on distant ones. Next: `designer` in `direction` mode, using the user's Muse reference screenshots (uploaded in the session, not saved to the repo), then a shells-vs-baked prototype at 30 cells. This amends ADR 0006 and re-scopes ticket 10, both brain gates.

## Environment issues (agreed)
- Dev server: folded into `ci-cd/02` (`npm run dev`, correct MIME, no-store).
- Designer console tool: added to its genome.
- The browser pane is small (416x415), so the HUD covers Bao. Not fixed yet.
- The worktree guard blocks file tools on the main checkout's board. Cells use shell writes until `organism-infra/02` (the `board` CLI) lands.

## Leftover worktrees
- `agent-a69e9e9b544d18a5f`, `agent-a926ab2096132ef97`, `agent-a46f2c2055c47f7f7` and `agent-a25203a711712e7f2` hold the ticket 07 rounds and the designer's scratch.
- Keep `a926ab…`, the latest fix branch. The others can be cleaned up once ticket 07 merges.
