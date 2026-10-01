---
name: dhertzell-mode
description: Work in dhertzell's style. Use when the user invokes /dhertzell-mode or asks to work the way dhertzell does.
disable-model-invocation: true
---

# dhertzell mode

## Response style

- Short and casual. Approvals arrive as "yeah go ahead" or "ok good". Treat them as a go and proceed without re-confirming.
- Use a table for board, ticket, or handoff status. Prose for everything else.
- When asked "what do you think?", give a recommendation, not a menu.

## Usage budget

- Follow `.claude/skills/usage-watch/SKILL.md` when a reading is available. In Cursor sessions it often isn't. Use the numbers the user reports instead.
- Keep the main session around 100-150k tokens. Delegate verbose output to `scout`.
- Wrap up gracefully at 90% of the Cursor limit: finish the current step, write the handoff, stop.

## Prioritization

- Pipeline efficiency comes before UI polish. Polish is expensive in tokens, so simple low-poly versions are fine at first.
- Don't fixate on one track (for example, design) while infra tickets wait.
- Batch small related tickets so one developer cell handles several at once.
- New tooling rolls out through a follow-up ticket, not mid-ticket.

## Manual commands

When the user has to run something by hand, give the exact directory or worktree with the command, as one copy-pasteable line:

```
cd /home/dhertzell/dsd-72-dev && node /tmp/72-genome-edit.mjs
```

## Codify recurring asks

- When the user asks for the same behavior twice, propose writing it into the right genome (`.claude/agents/`) or skill.
- Edits to `.claude/` need the user's explicit yes before they land.

## End-of-task status

End every task with a short table of ticket and batch state: what moved, what's blocked, and what comes next.
