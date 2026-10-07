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
- **orchestrator, 2026-10-07:** Scout diagnosis: every genome lists Grep; no hook or permission rule denies it; no system ripgrep (`which rg` empty); Claude Code is the native install 2.1.287. The orchestrator session itself has no Grep/Glob in its runtime tool list. Agreed fix (user 2026-10-07): the user installs ripgrep, then a cell retests whether Grep is in its tool list and makes one reproducing call. Retest is held until the install is done.
- **orchestrator, 2026-10-07:** Retest after ripgrep install (rg 14.1.0 at /usr/bin/rg), same Claude Code process (started before the install): a scout whose genome lists Read, Grep, Glob, Bash, WebFetch, WebSearch got only Read, Bash, WebFetch, WebSearch at runtime. Grep and Glob are both removed by the harness, not denied by repo config. Next: retest in a fresh session; if still missing, the fix is the gated genome/protocol edit (search with grep/rg via Bash, quote globs).
