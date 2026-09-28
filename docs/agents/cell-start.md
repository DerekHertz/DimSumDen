# Starting a cell at the previous hop's commit

Agent-tool worktrees always start detached at `main`. Each relay hop must build on the prior hop's commit, so dispatch puts one command in the cell's prompt instead of manual git steps:

```
node scripts/cell-start.mjs --base <sha> --branch <name>   # developer: starts on qa's tests commit
node scripts/cell-start.mjs --base <sha> --detach          # qa verify, security: detached at the developer's commit
```

The cell runs it first, inside its worktree. It:

1. Refuses (non-zero exit, reason on stderr, nothing changed) in the main checkout, in a dirty worktree (untracked files count), for an unknown `<sha>`, for an existing `<name>`, or for bad arguments.
2. Switches to a new branch at `<sha>`, or detaches there.
3. Runs `npm ci` in the worktree; a failure exits non-zero.

Keep it a single plain command so the isolation guard allows it. The orchestrator takes `<sha>` from the prior hop's handoff.
