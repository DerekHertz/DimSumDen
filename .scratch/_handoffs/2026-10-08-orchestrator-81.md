# Orchestrator handoff 81 (2026-10-08)

## State
- **Resolved this session:**
  - organism-infra/157 (PR #197, 74a63ed): `usage.mjs` now prints `resets_local`.
  - den-v1/05 (PR #198, 8f036b2): F opens the live transcript. The user's visual critique: ship it.
  - Both advisory-outcome rows are logged. No bounces.
- **Retro 2026-10-08 (second):** the `retro` row is logged.
  - Fix #1 is merged (PR #199, 4c667a0): designer `spec` mode never runs as a background cell. The user runs `claude --agent designer "<dispatch-prompt output>"`.
  - Fix #2 is filed as organism-infra/205 (P3): designer budget 100k/120k, with a gated protocol-skill edit.
- **New tickets:**
  - den-v1/12 (P3): two of qa's test gaps from 05, plus security's prototype-key bug in `transcript-buffer.mjs`. Fix it before organism-infra/106 sends transcript frames.
  - organism-infra/205 (P3).
- **Worktrees:** only `main`. No locks, no stashes.
- **Watch next retro:**
  - qa light verify on haiku ran a full verify on 05, because it read "you ran specify" as "this session wrote the tests". One occurrence so far. If it happens again, have `dispatch-prompt` print the verify mode.
  - `usage.jsonl` line 1182 (2026-10-02) has ANSI colour codes and won't parse. Readers skip it.
- **Gated patches still pending, waiting on the user:** `136-jev-go-live-genome.patch` and `198-orchestrator-genome.patch` in `.scratch/_handoffs/gated/`. The second is organism-infra/198, not PR #198.
- **North star:** den-v1. Run 06 → 07 → 09 next, ahead of the mods tickets and 143, 167, 204, 205 and den-v1/12.

## Next
1. Propose den-v1/06 (P1). If it's a UI ticket, designer spec now runs as the user's session (PR #199).
2. Ask the user about the gated patches 136 and 198.
