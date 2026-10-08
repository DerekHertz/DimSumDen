# 208: hook stops a cell's work at 80k context

**Type:** chore

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** relay cost. Cells keep running past 80k context instead of returning `outcome: partial` (the "Context budget" rule in `organism-protocol`). That has happened 7 times, most recently den-v1/07, where a developer reached about 110k and skipped /code-review. The wording has failed repeatedly, and the `cell-start` gate (organism-infra/119) only checks at start. 205 covers the designer only.

## What to build

A `PreToolUse` hook in `.claude/settings.json` that runs for subagent cells. It reads the cell's context with the same logic as `scripts/context.mjs`. At 70k or more, it injects a one-time warning. At 80k or more, it refuses every tool call except the budget wind-down: `git add`/`git commit`, `npm run board -- handoff|release|comment`, writing a handoff draft under `/tmp`, and `node scripts/log-cell.mjs`. The refusal message names the partial-return steps. The orchestrator's main session is unaffected; it has its own gate.

## Acceptance criteria

- [ ] A cell at 80k or more gets a refusal for Edit, Write (outside `/tmp`), Read and general Bash. The refusal message points to the partial-return steps.
- [ ] The wind-down commands above still run at 80k or more.
- [ ] A cell at 70k to 80k gets one warning and is not refused.
- [ ] The main orchestrator session is never refused by this hook.
- [ ] The hook fails open (allows) when it cannot read context.
- [ ] The `.claude/settings.json` change is written into the developer handoff as an exact diff for the user to apply.
- [ ] `npm test` is green.

## Comments

- **Created (orchestrator, 2026-10-08, pipeline retro):** cause "cell runs past 80k", tool other/context-budget, 7th occurrence; the wording fix failed, so this moves it to code (user approved).
- **orchestrator, 2026-10-08:** Before/after test (user, 2026-10-08): baseline from the last 19 resolved tickets (10-06 to 10-08): median 326k tokens/ticket, 5.4 cells/ticket, 23/80 cells ended at >=80k context, qa verify median 56k, incidents 23 context-budget / 11 verify-mode. After window: the first 10 tickets resolved once both 207 and 208 merge; pipeline-retro reruns the same query.
