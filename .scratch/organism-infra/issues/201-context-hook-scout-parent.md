# 201: context-budget hook measures a subagent by its own context, not its parent's

**Type:** task

**Priority:** P2

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** Relay hygiene (pipeline-retro 2026-10-08).

## What to build

A scout dispatched by a developer at 109k was refused by `scripts/hooks/context-budget.mjs`. The hook applied the parent cell's context to the scout. A fresh subagent starts small, so it should be measured by its own transcript.

## Acceptance criteria

- [ ] The hook measures a subagent's own transcript (fixture test with a large parent and a small child).
- [ ] The parent's own 80k refusal still fires.
- [ ] `npm test` green.

## Comments
- **orchestrator, 2026-10-08:** Filed from the pipeline-retro on the user's yes.
