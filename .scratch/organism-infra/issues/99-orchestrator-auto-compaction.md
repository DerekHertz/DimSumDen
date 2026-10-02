# 99: Orchestrator auto-compaction at the context budget

**Type:** design-question

**Priority:** P2

**Blocked by:** None

**Status:** ready-for-agent

## What to build

The orchestrator genome caps its context at 80k tokens (start no new tickets at 70k; at 80k write the session handoff and ask the user to run `/compact`). Today the orchestrator has to notice the budget itself, write the handoff by hand, and wait for the user to type `/compact`. Built-in auto-compaction fires only near the full window, far above 80k. Design (architect first) the most automatic version Claude Code allows:

1. Find out whether any supported mechanism can trigger compaction or lower its threshold: a settings key, an env var, a hook (e.g. `PreCompact`, `Stop`, `UserPromptSubmit`), or a status-line command. Cite the docs; don't guess.
2. Failing a trigger, automate everything around it: a script or hook that reads `scripts/context.mjs`, writes or updates the session handoff at 70k/80k, and surfaces a `/compact` prompt (status line or hook message) so the user's only step is typing it.
3. Make sure compaction keeps what the relay needs (the `# Compact instructions` in `CLAUDE.md`, the handoff path), and that background cells still report to the compacted session.

Files: `scripts/` (new helper and test), `.claude/settings*.json` or hooks (user-gated), `.claude/agents/orchestrator.md` (user-gated), `docs/adr/` if the architect records a decision.

## Acceptance criteria

- [ ] Architect records which compaction triggers exist (with doc citations) and the chosen design; ADR if it changes the loop
- [ ] At 80k the session handoff is written or updated without the orchestrator doing it by hand (test)
- [ ] The user sees a clear `/compact` prompt at 80k, or compaction runs on its own if a supported trigger exists
- [ ] Gated `.claude/` or `CLAUDE.md` edits are handed to the user as one apply command

## Comments
- **orchestrator, 2026-10-02:** User asked "can we set up an autocompaction skill or script?" and said yes to filing it (2026-10-02). A skill can't run `/compact` itself; architect checks hooks and settings first.
