# 194: A cell at its context stop can still hand back its report

**Type:** task

**Priority:** P2

**Blocked by:** None (can start immediately)

**Status:** in-review

**Serves:** every relay (the context-budget partial-return path from organism-infra/119). Two architect returns on 136 (2026-10-07) delivered no report to the orchestrator, which then had to rebuild the return from board state.

## What to build

`scripts/hooks/context-budget.mjs` is a PreToolUse hook with no matcher (registered in `.claude/settings.json`). Once a cell's context reaches its stop threshold (`scripts/context-budget.json`; architect 80k), it refuses every tool call except the ones `isWrapUpCall` allows: git add/commit, `npm run board -- handoff|release|comment`, `node scripts/context.mjs`, and Write/Edit under `.scratch/` or the session scratchpad. SubagentHandback is not on that list. So a cell that follows the "Context budget" stop steps in `organism-protocol` (WIP commit, handoff, release, final report with `outcome: partial`) cannot deliver its final report.

Add the SubagentHandback tool to the wrap-up allowlist in `isWrapUpCall`. The fix lives in `scripts/hooks/`, which cells can edit; `.claude/settings.json` needs no change.

## Acceptance criteria

- [ ] At or above the stop threshold, a cell's SubagentHandback call is allowed.
- [ ] At or above the stop threshold, a non-wrap-up call (for example Read or Grep) is still refused.
- [ ] Below the threshold, and for the orchestrator session, behaviour is unchanged.
- [ ] Tests cover the three cases above with hook input fixtures.

## Comments

- **Created (orchestrator, 2026-10-07):** The user chose to scout the hook now (environment-fix agreement on 136). Scout findings: the hook refuses at stop, SubagentHandback is missing from `isWrapUpCall`, and no SubagentStop hook is involved.
- **qa, 2026-10-08:** QA pass (full verify). Full npm test x3 via scout: 2423/2423 each run, 0 fail, 0 skipped. Handback test file unchanged since 07ca7f2. Non-blocking: developer's earlier 2422/2423 run unexplained, not reproduced in 3 runs; no boundary test at 79,999 for architect below stop.
