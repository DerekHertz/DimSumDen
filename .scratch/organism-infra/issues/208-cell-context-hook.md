# 208: hook stops a cell's work at 80k context

**Type:** chore

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** resolved

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
- **orchestrator, 2026-10-08:** Scope settled by the user after qa specify (most of 208 already exists in `scripts/hooks/context-budget.mjs`): (1) lower developer and qa in `scripts/context-budget.json` to warn 70k / stop 80k, and update the tiers tests to match, alongside the 3 gaps qa wrote tests for (warn once, log-cell allowed, plain `/tmp` writes allowed). (2) Before the developer starts, a scout runs a live probe of whether the hook reads a real context number inside a worktree cell (the 162 open item). If it fails open live, the fix joins this ticket.
- **orchestrator, 2026-10-08:** Live probe (scout, from a worktree subagent): the hook works. `context.mjs --self` returned a real count (14336) through session_id + cwd; fail-open happens only when no subagent transcript matches the cwd. No live-firing fix needed; the developer scope is the threshold change plus qa's 3 gaps.
- **qa, 2026-10-08:** QA pass (light verify) at 30bf95e: 13/13 208 tests pass unedited since 83d3e27; suite 2997 pass, 0 fail, 0 skipped (saved output). AC6 human-verified. Developer also edited 5 older test files; listed in handoff for orchestrator.
- **qa, 2026-10-08:** Correction: the developer edited 6 older test files, not 5. Full list in the qa verify handoff.
- **security, 2026-10-08:** Security pass at 30bf95e. gitleaks clean, npm audit 0, no dep/CI change. Low: /tmp write allow follows pre-existing symlinks; warned-marker files never cleaned. Detail in 208-security handoff.
- **orchestrator, 2026-10-08:** Before/after test: 208 merged (PR #203, ba4300f). The next 10 tickets resolved from here on are the after window; pipeline-retro reruns the baseline query from 207/208 then.
