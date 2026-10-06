# 156: Diagnose the Grep tool being unavailable in cells

**Type:** bug

**Priority:** P2

**Blocked by:** none

**Status:** ready-for-agent

**Serves:** Cells search their worktree with the Grep tool instead of falling back to `grep` through Bash.

Source: the 140 architect round (2026-10-06) reported the Grep tool unavailable twice and used `grep` via Bash (incident in `.scratch/usage.jsonl`). User decision 2026-10-06: file a scout diagnosis ticket.

## What to build

Find why the Grep tool is unavailable in a cell (genome tool list, permissions, the isolation guard, ripgrep missing, or the worktree `path` argument) and fix the cause, or file the fix if it is in a gated file.

## Acceptance criteria

- [ ] The cause is named with evidence (a reproducing call and its error).
- [ ] The fix lands, or the exact gated edit is written down for the user.

## Comments
