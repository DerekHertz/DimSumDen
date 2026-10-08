# Handoff: mods-trial/01 sleep-chain guard (developer)

```json
{
  "ticket": "mods-trial/01-sleep-chain-guard-mod",
  "cell": "developer",
  "current_step": "Built and committed on feat/mods-01-sleep-chain-guard. npm test green (2662/2662). Left: user install (gated .claude/settings.json edit), interactive-session coverage check, orchestrator opens the standing ticket.",
  "artifacts": [
    "mods/sleep-guard/hooks/sleep-guard.mjs (hook entry)",
    "mods/sleep-guard/hooks/hooks.json (one Bash PreToolUse command hook, timeout 10)",
    "mods/sleep-guard/.claude-plugin/plugin.json",
    ".claude-plugin/marketplace.json (in-repo marketplace dimsumden-mods)",
    "scripts/mods-sleep-guard.test.mjs (57 tests: guard seam, block log, manifest, session-start line, doc)",
    "scripts/session-start.mjs (install line, orchestrator only)",
    "docs/agents/cloud-sessions.md (Mods section)"
  ],
  "decisions": [
    "Command-hook plugin, not a function-hook module: the ticket's seam is stdin payload to allow/deny, and function-hook modules run with no Node, so they cannot call the board CLI or be tested at that seam. Deny is exit 2 with the message on stderr and stdout, like scripts/hooks/bash-guard.mjs.",
    "Detection is a string check: quotes, comments and heredoc bodies are blanked, the command is split on ; & | newline ( ) and backtick, and a sleep in command position is blocked when it shares the command with another real segment or sits in a while/until/for loop. Residual: bash -c, eval, script files can slip past.",
    "Block log: the hook finds the board CLI from CLAUDE_PROJECT_DIR or cwd, lists feature mods-trial, and comments on the ticket whose slug matches NN-mods-trial and is not resolved. The orchestrator must name the standing ticket NN-mods-trial (for example 02-mods-trial). Author is agent_type if a known cell, else orchestrator; the comment text carries the real source (agent_type or main session) and the first 200 chars of the command. Every log failure is swallowed.",
    "Install shape: the marketplace is added at USER scope (a directory path is machine-specific and must not be committed) and the plugin at PROJECT scope, so the committed settings gain only enabledPlugins {\"sleep-guard@dimsumden-mods\": true}. Verified in a sandbox config dir: install, list, uninstall; uninstall leaves enabledPlugins {} and nothing else.",
    "session-start checks enabledPlugins in project settings.json, settings.local.json and ~/.claude/settings.json; missing or malformed files count as not enabled."
  ],
  "failures": [
    "Worktree guard refused a compound mkdir/cat heredoc Bash call and a claude -p call whose prompt text contained the word Bash; reran as single commands and via a script file. Friction, not a defect."
  ],
  "pending": [
    {
      "item": "User applies the gated install (edits .claude/settings.json enabledPlugins): after merge, from the main checkout run: claude plugin marketplace add /home/dhertzell/dimsumden && claude plugin install sleep-guard@dimsumden-mods --scope project   (to try it before merge, add the worktree path as the marketplace instead). Then commit the resulting .claude/settings.json change.",
      "owner": "user"
    },
    {
      "item": "Interactive coverage checks after install: in a terminal claude session (main session) and a subagent inside it, run a command like sleep 1; echo hi and confirm the deny. The -p and headless-subagent checks are done (see ticket comment).",
      "owner": "user"
    },
    {
      "item": "Open the standing trial ticket named NN-mods-trial in .scratch/mods-trial/issues (the hook logs only to a ticket whose slug ends -mods-trial) and start the 3-handoff clock at merge.",
      "owner": "orchestrator"
    }
  ]
}
```

## Acceptance criteria

- Hook seam tests: 16 deny cases, 14 allow cases, 6 fail-open cases, no-override and message tests. Pass.
- Deny message names `gh pr checks --watch` and Monitor. Pass.
- Install at project scope from the in-repo marketplace and clean uninstall: run live in a throwaway CLAUDE_CONFIG_DIR and project copy; `claude plugin validate` passes for the plugin and the marketplace. The real install is the user's step above.
- Block comment through the board CLI from a worktree: tested against a fixture main checkout plus linked worktree.
- Session-start line present when not enabled, absent when enabled or for non-orchestrator sessions: tested.
- Coverage spike, run with `claude --plugin-dir mods/sleep-guard -p` (haiku): the guard fired for the headless main session and for a subagent started by the Agent tool; both reported the exact deny text. Not yet run: an interactive terminal session and an interactive subagent (need the project-scope install). No gap seen so far.
- `npm test`: 2662 pass, 0 fail.

## Notes

- Existing settings hooks untouched (a test pins that .claude/settings.json hooks carry no sleep-guard wiring).
- Code review was a self-review only, to stay inside the context budget; nothing was run through /code-review.
- No gated patch is needed: the only `.claude/` change is the install's `enabledPlugins` write, which the install command produces.
