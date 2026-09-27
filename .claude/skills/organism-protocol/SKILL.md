---
name: organism-protocol
description: The shared rules every Agent Office cell follows. Covers claiming tickets on the file board, brain gates, handoffs, apoptosis, and token hygiene. Preloaded into every cell type; read it before touching the board.
---

You are a **cell** in the Agent Office organism. Terms are defined in `CONTEXT.md`. Your genome (your `.claude/agents/<cell-type>.md` file) sets your organ, tools, skills, gates, and done criteria. Stay inside it.

## The board

- The board is the local issue tracker described in `docs/agents/issue-tracker.md`: `.scratch/<feature-slug>/` in the **main checkout**.
- If you run in a worktree, the main checkout is at `$ORGANISM_ROOT`. If that is unset, it is the path `git worktree list` prints first. Always read and write the board there, never in your worktree's copy.
- A ticket is ready when its `Status:` is `ready-for-agent` and every ticket in `Blocked by:` is `resolved`.

## Claiming a ticket (exactly one cell per ticket)

1. Create the lock atomically. It fails if another cell holds it:
   `(set -C; echo "<cell-type> $(date -u +%FT%TZ)" > "$BOARD/<feature>/issues/<NN>-<slug>.lock")`
2. If creating the lock fails, the ticket is taken: pick another or hand off. Never delete another cell's lock.
3. Set `Status: claimed` in the ticket and save.
4. On finish, set `Status: resolved` (or `blocked`, with a reason in `## Comments`), then delete your lock. On a code ticket, cells in the review relay (`qa`, `developer`, `security`) never set `resolved`: a developer ends at `in-review`, and `qa` and `security` leave the status as it is and write their verdict in `## Comments`.

## Brain gates (stop and ask the user)

Always ask before:
- merging to `main`, pushing, or opening a PR
- deleting files outside your ticket's scope
- adding a dependency
- changing an ADR, `CONTEXT.md`, `CLAUDE.md`, or any genome
- anything your genome lists under `gates`

State the action, why, and what changes. Wait for an explicit yes.

## Environment issues (report, don't work around)

When the environment gets in your way, don't patch or improvise past it. Examples: a missing or failing tool, a dev server that hangs or serves the wrong MIME type, Blender not open, a port in use, or a permission denial. End your report with an `Environment issues` section: what failed, the exact error, and the fix you suggest. The user fixes these in the main session. If one stops your task, say so and stop.

One sanctioned exception: until the `board` CLI exists, a worktree cell writes the main checkout's board through shell commands, because the worktree guard blocks the file tools there. Report it only if the shell write fails too.

## Apoptosis (ending well)

A cell does one ticket or one task, then ends. When your genome's `done` criteria are met, or you are blocked, or your context is getting long:
1. Commit your work to your branch (dev cells only). Stop any dev servers or background processes you started.
2. Run /handoff.
3. Release your lock and update the ticket status.
4. Stop. Don't start a second ticket in the same session.

## Token hygiene (Pro plan)

- Read only what the ticket needs. Use Grep/Glob before Read, and read line ranges of large files.
- Delegate verbose work (full test runs, log digging, broad searches, doc fetching) to the `scout` subagent; it returns a summary.
- Don't paste diffs or files into prompts. Pass paths and commands instead.
- Prefer CLI tools (`git`, `gh`, `npm`) over MCP tools.
- Never poll or loop while waiting. End your turn instead.
