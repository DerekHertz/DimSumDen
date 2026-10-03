# 126: log-cell and jev resolve the board and refs like board does

**Type:** fix

**Priority:** P2

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** pipeline retro 2026-10-03, cause 1 (relay scripts disagree with `board` on root and refs).

## What to build

`board` finds the main checkout itself and accepts short refs. `scripts/log-cell.mjs` resolves its root from `$ORGANISM_ROOT` or the cwd (line 60). Run from a worktree, it reads that worktree's tracked `.scratch` copy and refuses a handoff that was published to the main checkout. `scripts/jev.mjs` (`route`, `tier`, `advisory-outcome`) refuses a short ref such as `organism-infra/102` with "ticket not found". Have both scripts use the root finder and ref resolver that `board` already uses, so they run from any worktree and take the same refs. Don't write a second copy. `$ORGANISM_ROOT` still wins when it is set (the tests rely on it).

## Acceptance criteria

- [ ] Run from a worktree with no `$ORGANISM_ROOT`, `log-cell.mjs` finds the handoff published in the main checkout and appends to the main checkout's `.scratch/usage.jsonl`.
- [ ] `jev.mjs route|tier|advisory-outcome --ticket <feature>/<NN>` resolves to the full slug ref, the same way `board` does. An ambiguous or missing NN still refuses.
- [ ] Setting `$ORGANISM_ROOT` still overrides the root in both scripts.
- [ ] `npm test` is green.

## Comments

- **Created (orchestrator, 2026-10-03):** Pipeline retro. Incidents: the log-cell root from a worktree (102), the jev short ref (102), and earlier on 2026-10-01 log-cell/jev with `none/...` refs.
