# 145: Context hook stops cells at 70k/80k

**Type:** feature

**Priority:** P1

**Blocked by:** none

**Status:** claimed

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
- **orchestrator, 2026-10-06:** Retro 2026-10-06: context overrun without a partial return hit 3 cells on 140 in a row (qa ~150k, architect ~134k, developer ~141k). User: 145 goes next after 140, ahead of 141.
- **orchestrator, 2026-10-06 (user yes):** Rescoped. organism-infra/162 (merged) already ships the cell hook: PreToolUse warning at 70k and refusal at 80k in `scripts/hooks/context-budget.mjs`, which skips the orchestrator. Criteria 1–3 are covered by 162 and are dropped. What is left: (1) **architect** re-evaluates the cell thresholds from `usage.jsonl` cell rows (partial-return chains vs. single long cells: total tokens, wall time, rework) and proposes numbers, possibly per cell type, for the user to approve. (2) Then one infra relay, batched with 165 (same file): the thresholds are read from one config value shared by the 162 hook, `cell-start` and `context.mjs`, and `organism-protocol` "Context budget" gets a gated edit with the chosen numbers. (3) Optional: the orchestrator's own 70k/80k wording as a hook. The architect decides whether this earns its place, given that `cell-start` already gates at 80k.
- **architect, 2026-10-06:** Architect proposal in handoffs/145-architect.md: developer and qa 100k warn / 120k stop, other cells and orchestrator 70k/80k; one config scripts/context-budget.json via scripts/context-budget.mjs. Part 3 orchestrator hook: no. Awaiting user approval of numbers.
- **orchestrator, 2026-10-06 (user yes):** Architect proposal approved (handoffs/145-architect.md). Limits (warn/stop): developer and qa 100k/120k; security, architect, designer, scout 70k/80k; orchestrator 70k/80k under its own key. They live in `scripts/context-budget.json`, read through `scripts/context-budget.mjs` `budgetFor(role)` by the 162 hook, `cell-start` (orchestrator key) and `context.mjs --cell`. Part 3 (orchestrator hook) is dropped. The `organism-protocol` "Context budget" edit is gated. Re-check after 30 or more cells have been logged under the hook. Runs as batch C with 165 after 147.
- **orchestrator, 2026-10-06 (user yes):** Batch C also carries a one-line ADR 0010 amendment under decision 3: "*Amendment (organism-infra/160, 2026-10-06):* for `verify`, the shadow and fallback baseline is today's relay rule: `light` when qa ran `specify` for the ticket, `full` otherwise. So shadow `effective` reports `light` after qa specify. `tier` is unchanged." Docs only; the developer adds it verbatim.
- **orchestrator, 2026-10-06:** batch C started 2026-10-06 (user yes): 145 + 165 + ADR 0010 note, one relay, one branch. qa specify first. Runs in parallel with 166 (no file overlap).
- **qa, 2026-10-06:** partial: context budget, tests unrun
- **qa, 2026-10-06:** qa specify partial: tests committed (b1c8093, tests/batch-c-context-budget) but unrun; SubagentHandback was refused by the 80k hook (not on its allowlist). See handoffs/145-qa-specify.md and 165-qa-specify.md.
