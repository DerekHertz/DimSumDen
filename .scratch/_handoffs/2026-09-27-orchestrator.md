# Handoff: orchestrator session (2026-09-27)

**Wrapped up at 70% of the 5-hour window** (resets 20:50Z). `get_usage` reports "Max", but the user is on **Pro**, so treat its percentages as optimistic (see `organism-infra/10`).

## Done
- `character-animation/07` merged (PR #7, `eea046a`) and set `resolved`. Its polish went to `character-animation/11`.
- Priority order set with the user: `_handoffs/2026-09-27-priority-order.md`. The organism loop comes before animation; token savings (`organism-infra/08-10`) run right after `ci-cd/02`.
- New tickets:
  - `organism-infra/04`: Jev vs a local GPU model
  - `organism-infra/05`: dispatch onto an existing branch
  - `organism-infra/06`: repo move from HDD to NVMe (user)
  - `organism-infra/07`: caches on `E:`
  - `organism-infra/08`: risk-sized review
  - `organism-infra/09`: trim tool load
  - `organism-infra/10`: session and report rules
  - `character-animation/11`: prop polish
- Product scope note for the MVP slice, plus the creator-reference features: `_handoffs/2026-09-27-new-scope-for-product.md`, with screenshots in `_handoffs/refs/`.

## In flight
- **`ci-cd/02`** is `ready-for-agent` after security bounce 1 (the dev server binds 0.0.0.0). The one-line fix and next steps are in its last Comment.
  - Branch `claude/ci-cd-02-headless-ui-smoke` @ f13b165, worktree `.claude/worktrees/ci-cd-02-dev`.
  - qa verify passed: 46/46, `npm test` exits.

## Dispatch notes (until `organism-infra/05` lands)
- For a fix round on an existing branch, reuse that branch's worktree, or create one with `git worktree add <path> -b <branch> <base>`. Then dispatch a `general-purpose` agent that reads the cell's genome, with the genome's model passed explicitly and no isolation. Fresh isolated worktrees can't check out another branch.
- The session's agent registry loads at session start. Start a new orchestrator from up-to-date `main` with `claude --agent orchestrator` (Opus, low effort, per `organism-infra/10`).
- After every cell returns, check for leftover `node` processes and stale locks (`docs/agents/process-hygiene.md`). Kill or release only with the user's yes.

## Waiting on the user
- PR #8 (`claude/jev-integration-efficiency-d0dc8c`, `docs/agents/process-hygiene.md`) needs review and merge. There are no CI checks yet.

## Worktrees
The ticket 07 worktrees and their merged branches were removed with the user's yes (2026-09-27): `a926…`, `aad01…`, `a69e…`, `a252…`, and `a46f…`, which held only round-1 designer scratch. `ae864…` was already gone. Still present: `agent-a23cfa9e98c016d4d` (qa's ci-cd/02 tests branch, needed until ci-cd/02 merges), `ci-cd-02-dev`, `agent-a919cafc1cb3eea97` (ticket 04 WIP at `a83baee`; check whether it's still needed), and several older `claude/*` session worktrees for `organism-infra/05` to sort out.
