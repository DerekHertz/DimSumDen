# 52: PreToolUse hook rejects compound Bash in worktrees, with the rule text

**Type:** feature

**Priority:** P1

**What to build:** In session 8, 12 of 14 cell hops had Bash calls refused by the worktree isolation guard: about 22 refusals, each costing a turn. The rule was in organism-protocol as wording, was widened, and still failed, so pipeline-retro sends it to code. Add a script `scripts/hooks/bash-guard.mjs` and register it as a project `PreToolUse` hook on `Bash` in `.claude/settings.json`. When the session cwd is under `.claude/worktrees/`, it rejects a command containing `&&`, `||`, `;`, a heredoc (`<<`), a leading `cd`, or a `$` variable in arguments. It exits with the hook's block code and a one-line reason quoting the organism-protocol rule and the Write-a-script alternative. Outside worktrees it allows everything. Read the Claude Code hooks docs for the exact input JSON and exit-code contract. Don't guess it.

The `.claude/settings.json` change is user-gated. The PR merge is that gate.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Each pattern is blocked in a worktree cwd, with a reason naming the rule (tests on the script's stdin/stdout contract)
- [ ] Plain single commands in a worktree, and any command outside worktrees, are allowed (tests)
- [ ] False-positive check: `$` inside single-quoted node `-e` code and `;` inside quoted strings are handled or documented (test)
- [ ] Hook registered in `.claude/settings.json`

## Comments

- **Created (orchestrator, 2026-09-29):** pipeline-retro fix #1, approved by the user (wording failed twice).

- **orchestrator, 2026-10-01:** Raised to P1 for 10-02 (user): pipeline saver.
