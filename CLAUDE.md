# Dim Sum Den (formerly Agent Office)

A local web app for observing and steering AI agents across the SDLC, modeled as an organism. Vocabulary lives in `CONTEXT.md`; use its terms. Decisions live in `docs/adr/`.

Stack (planned): a TypeScript monorepo with a Node daemon and a React + React Three Fiber UI. No app code exists yet.

## Cells

Cell types are defined by genomes in `.claude/agents/`: `product`, `architect`, and `orchestrator` (Pass), `developer`, `scout` and `debugger` (Steamers), `qa` and `security` (Tea & Pantry), plus `designer` (Front of House). Code tickets run a relay: qa writes failing tests, developer makes them pass, qa verifies, security reviews, then the orchestrator proposes the merge. designer specs and reviews UI tickets and critiques asset tickets. Every cell follows the `organism-protocol` skill: claim before working, stop at pass gates, hand off, then end.

Run a cell as the main session with `claude --agent <cell-type>`. If a session is asked to act as a cell without that flag, read `.claude/agents/<cell-type>.md` first and follow it.

## Agent skills

### Issue tracker

The board is local markdown under `.scratch/` in the main checkout, with lock-file claims. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Token hygiene

This runs on a Pro plan. Keep this file short, read narrowly, and delegate verbose output to `scout`.

# Compact instructions

When compacting, keep: the current ticket path, acceptance criteria status, the branch, and unresolved errors. Drop exploration output.
