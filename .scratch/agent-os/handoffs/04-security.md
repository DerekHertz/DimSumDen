# Handoff: agent-os/04-no-prompt-slice (security)

```json
{
  "ticket": "agent-os/04-no-prompt-slice",
  "cell": "security",
  "current_step": "Security pass. Diff origin/main..b986d735 reviewed by hand; gitleaks clean; 35 new tests green.",
  "artifacts": [
    "apps/bridge/cells/claude-adapter.mjs",
    "apps/bridge/cells/claude-runtime.mjs",
    "apps/bridge/cells/ceilings.json",
    "scripts/risk-check.mjs"
  ],
  "decisions": [
    "Pass: no critical or high findings.",
    "Allow rules Write(//wt/**) and Edit(//wt/**) match the existing Read(//ticket) convention; deny rules .claude/**, git push, gh pr create stay and take precedence over allow.",
    "worktree regex excludes glob chars, spaces, dot segments and root; cwd comes from host workspace.dir, not agent text.",
    "Empty host lists with strictAllowlist and failIfUnavailable: no network from the agent shell, fail closed.",
    "No dependency, lockfile or workflow change."
  ],
  "failures": [],
  "pending": []
}
```

## Findings (medium or low, non-blocking)

- claude-adapter.mjs isWorktreePath (~line 69), low: it accepts any plain absolute path with one or more segments, such as /home/user, not only a real worktree. Safe today because the only caller passes host-created workspace.dir. If a later ticket takes cwd from outside the host, add a check that it is under .claude/worktrees or the den workspace root.
- claude-adapter.mjs DENY_RULES (line 27), low: deny paths are relative (.claude/**), so they protect .claude inside the worktree only. The write allow is scoped to the worktree, so this is consistent. No change needed.
- ceilings.json, informational: the file is now a guardrail path in risk-check, so every later edit routes to security review. Good.
