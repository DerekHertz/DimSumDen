# 215: qa sessions lose the Grep tool

**Type:** bug

**Priority:** P3

**Blocked by:** None

**Status:** ready-for-agent

**Serves:** Testbed friction: five incidents since 2026-10-02 (`"tool":"Grep"` in `.scratch/usage.jsonl`), mostly qa on Haiku, where a Grep call returns "No such tool available" and the cell falls back to grep in Bash. No fix has been tried yet.

## What to build

1. Find why a qa cell's session lacks Grep when `.claude/agents/qa.md` lists it: the model (Haiku), the worktree isolation, or the tool list in the genome frontmatter.
2. Fix the cause. If it is out of our control, make it fail loud instead: remove Grep from the affected genome's tools or add a one-line note where the cell reads it, so cells stop spending a failed call.

## Acceptance criteria

- [ ] The cause is named in the handoff with evidence (a reproduced dispatch, or the documented harness behaviour).
- [ ] A qa cell dispatched on Haiku either has Grep or is never offered it; no new `"tool":"Grep"` incident on the next three qa runs.

## Comments
- **orchestrator, 2026-10-09:** Filed from the retro on the user's yes.
