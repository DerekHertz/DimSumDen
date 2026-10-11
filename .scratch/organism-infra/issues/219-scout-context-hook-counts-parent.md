# 219: The context-budget hook counts the parent cell's transcript for a scout

**Type:** bug

**Priority:** P2

**Blocked by:** None

**Status:** ready-for-agent

**Serves:** Token hygiene. Cells send verbose work (full test runs) to `scout` to keep their own context small. When the hook refuses the scout, the cell runs the suite in its own context.

## What to build

On 2026-10-11 a `scout` dispatched from a developer cell (agent-os/02) had its Bash call refused by the context-budget hook. The hook counted the developer's transcript (109k tokens) against scout's 80k limit (`scripts/context-budget.json`). The developer ran `npm test` itself.

The hook should count the scout's own transcript, not the transcript of the cell that dispatched it. Reproduce first: the report comes from one developer cell and the cause is not confirmed.

## Acceptance criteria

- [ ] Failing test first: a scout started by a cell whose context is over scout's limit is not refused while the scout's own context is under its limit.
- [ ] A scout whose own context is over its limit is still refused.
- [ ] The budget of the dispatching cell is unchanged.
- [ ] `npm test` is green apart from known failures.

## Comments

- 2026-10-11, orchestrator: filed at the user's choice (environment issue from agent-os/02's developer, incident row in `.scratch/usage.jsonl`). This is likely a `.claude/` hook change; the relay's gated-file rule applies.
