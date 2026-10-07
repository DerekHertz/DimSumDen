# 153: Steering dispatch follow-ups: audit line, worktree per agent, real prompt template

**Type:** feature

**Priority:** P2

**Blocked by:** 143

**Status:** ready-for-agent

**Serves:** Den loop steps 3-4: an agent started from the Den runs isolated, with a real brief and an audit trail.

Parent: 106. Found by the 140 architect check (`.scratch/organism-infra/handoffs/140-architect.md`): none of these is in the ADR 0016 build order, the 106 split, or tickets 140-143. In 140 the host uses the main checkout as `cwd` and a minimal fixed prompt.

## What to build

1. A `dispatch-approve` audit line in `requests.jsonl` whenever `POST /agents` starts an agent (who approved which ref, role and mode).
2. A git worktree per dispatched agent instead of the main checkout as `cwd`.
3. The real prompt template a Den-started agent receives (needs an architect pass first: what the agent is told, and how `mode` feeds it).

## Acceptance criteria

- [ ] Every successful `POST /agents` writes one audit line to `requests.jsonl`.
- [ ] Each dispatched agent runs in its own worktree; the main checkout is never its `cwd`.
- [ ] The prompt template is recorded in an ADR and used by the host.

## Comments

- **orchestrator, 2026-10-06:** Filed with the user's yes. Architect first for item 3.
