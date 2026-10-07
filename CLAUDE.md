# Dim Sum Den (formerly Agent Office)

A local web app for observing and steering AI agents across the SDLC, modeled as an organism. Vocabulary lives in `CONTEXT.md`; use its terms. Decisions live in `docs/adr/`.

Stack: Node ESM scripts (`.mjs`, tests via `node --test`); Vite is the only build step. `apps/ui` is React + React Three Fiber; `apps/bridge` serves the UI and board state; `apps/organism-infra` is the board CLI; `apps/ci-cd` holds the dev server and smoke scripts; `scripts/` holds relay tooling. Common scripts: `npm test`, `npm run board -- <cmd>`, `npm run ui`, `npm run smoke:ui`, `npm run risk-check`.

## Cells

Cell types are defined by genomes in `.claude/agents/`, grouped into stations:
- `product`, `architect`, `orchestrator` (Pass)
- `developer`, `scout` (Steamers)
- `qa`, `security` (Tea & Pantry)
- `designer`, `herald` (Front of House); herald drafts public posts, the user publishes

Code tickets run a relay: qa `specify` writes failing tests, developer makes them pass, qa `verify` checks (light verify if qa specified, full otherwise), then `npm run risk-check`: a clean exit skips `security`, a hit dispatches it. The orchestrator opens the PR and merges on green CI. designer specs UI tickets with the user (a detailed spec plus low-cost mockups), and the user does all visual critique of UI and asset tickets until a cheaper automated critique exists. Every cell follows the `organism-protocol` skill: claim before working, stop at pass gates, hand off, then end.

Relay autonomy (see `organism-protocol`): once the user approves a ticket, the orchestrator runs its relay end to end, PR and merge included. Other gates still apply. It stops for user verdicts, open scope questions, a twice-failed ticket, environment issues, 5-hour usage at 90%+, or a red or conflicted merge. Up to two cells run at once (`max_concurrent_cells: 2`), on different tickets with non-overlapping files.

Run a cell as the main session with `claude --agent <cell-type>`. If a session is asked to act as a cell without that flag, read `.claude/agents/<cell-type>.md` first and follow it.

## Cloud sessions

Environment setup for cloud containers (browser path, proxy, usage readings) lives in `docs/agents/cloud-sessions.md`; read it when `CLAUDE_CODE_REMOTE` is set. Locally (WSL or macOS) none of it applies.

## Agent skills

### Issue tracker

The board is local markdown under `.scratch/` in the main checkout, with lock-file claims. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Token hygiene

This runs on a Pro plan. Keep this file short, read narrowly, and delegate verbose output to `scout`.

# Compact instructions

When compacting, keep: the current ticket path, acceptance criteria status, the branch, and unresolved errors. Drop exploration output.
