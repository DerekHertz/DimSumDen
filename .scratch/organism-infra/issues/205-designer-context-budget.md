# 205: Raise the designer's context budget to 100k/120k

**Type:** chore

**Priority:** P3

**Class:** pipeline

**Blocked by:** None (can start immediately)

**Status:** parked

**Serves:** retro 2026-10-08 fix #2. The designer ran out of context before asking the user anything, on den-v1/05 (twice).

## What to build

In `scripts/context-budget.json`, add `designer` under `cells` with `warn: 100000` and `stop: 120000`, the same as `developer` and `qa`. Then update the sentence in the `organism-protocol` skill's "Context budget" section that lists the 70k/80k cells. That is a `.claude/` edit, so it is gated: the developer writes the exact edit into its handoff.

## Acceptance criteria

- [ ] `node scripts/context.mjs --self --cell designer` reports `warn` 100000 and `stop` 120000.
- [ ] Every other cell's thresholds stay the same (a test pins them).
- [ ] The organism-protocol "Context budget" sentence lists designer with developer and qa (gated edit, applied by the user).
- [ ] `npm test` is green.

## Comments
- **orchestrator, 2026-10-11:** Parked: 2026-10-10 agent-system grill: tooling for the desktop relay, which the bridge relay replaces; revisit after the bridge relay exists
