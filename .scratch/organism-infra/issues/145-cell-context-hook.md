# 145: Context hook stops cells at 70k/80k

**Type:** feature

**Priority:** P1

**Blocked by:** none

**Status:** ready-for-agent

**Serves:** Testbed friction: cells run past the 80k context budget (105 developer 84.6k, 106 security 89k, 106 architect 115k), so every later call costs more.

## What to build

Ticket 119 told cells in prose (`organism-protocol`, "Context budget") to run `context.mjs --self` at stage boundaries. The pipeline retro of 2026-10-05 found that the wording didn't hold: three cells in a row went past 80k without returning `partial`. Replace the reminder with a hook. A `PostToolUse` hook script (under `scripts/`) reads the calling cell's own context the way `context.mjs --self` does. At 70k or more it injects a message telling the cell to finish its current stage and explore nothing new. At 80k or more it injects the partial-return instruction: commit work in progress, publish a handoff, release, and return `outcome: partial`. It stays silent below 70k and on a null reading, and it never blocks a tool call. The main orchestrator session gets its own wording (start no new tickets at 70k; write the handoff and ask for `/compact` at 80k). Keep it cheap: no output below 70k, and at most one message per threshold crossing for each session.

The `.claude/settings.json` registration is gated: the developer writes the exact edit into its handoff and the user applies it (see the orchestrator genome on `.claude/` edits).

## Acceptance criteria

- [ ] The hook script prints nothing below 70k or on a null reading, and exits 0 in every case (tests with fixture transcripts)
- [ ] At ≥70k and ≥80k it emits the matching message once per crossing, and the cell and orchestrator wordings differ (tests)
- [ ] A cell is told apart from the orchestrator session by the same rule `context.mjs --self` uses (test)
- [ ] The handoff contains the exact `.claude/settings.json` hook registration for the user to apply
- [ ] Before the hook ships, the 70k/80k thresholds are re-evaluated from `usage.jsonl` cell rows (partial-return chains vs single cells: total tokens, wall time, rework), and the chosen cell thresholds are read from one config value rather than hard-coded (see comment below)

## Comments

- **orchestrator, 2026-10-05:** Filed from pipeline-retro (user yes 2026-10-05). It replaces a wording fix that failed (ticket 119 part 3). Related to parked 99 (orchestrator auto-compaction), which owns `/compact` triggers.
- **orchestrator, 2026-10-05 (user direction):** Re-evaluate the budget itself, not only how it's enforced. If staying under the cell budget slows the product down more than the tokens it saves, raise or reshape it. Data points so far: the first 138 developer used its whole 85.8k reading and wrote no code, so its successor had to re-read; 139 qa specify split at 133k. Each partial return adds a cold start, which means re-reading the ticket, handoffs and code. Compare that re-read cost and the added wall time against the per-call savings of a smaller context. Possible outcomes: a higher cell threshold (e.g. 120k–150k), or a threshold set per cell type. Record the chosen numbers in `organism-protocol` "Context budget" (gated edit) and in the hook's config.
