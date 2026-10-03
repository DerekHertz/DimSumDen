# 122 developer

Branch `feat/122-new-session-per-ticket`, commit `ce80a9c` on tests `130f18f`. `scripts/next-session.test.mjs` passes 14 of 14.

```json
{
  "ticket": "organism-infra/122-new-session-per-ticket",
  "cell": "developer",
  "current_step": "Launcher and package script committed; scripts/next-session.test.mjs 14/14 green. Gated genome patch written to the main checkout, not yet applied (user runs npm run apply-gated).",
  "artifacts": ["scripts/next-session.mjs", "package.json", ".scratch/_handoffs/gated/122-next-session-genome.patch"],
  "decisions": [
    {"decision": "Prompt is `Read <abs handoff path>, then propose the next ticket from the frontier.`; print mode single-quotes it (shell-safe), --run passes it as one argv entry via spawnSync with no shell.", "why": "ticket: restates no rules; odd root paths must not split the prompt"},
    {"decision": "Handoff regex ^YYYY-MM-DD-orchestrator[-cloud]-N.md$ (N numeric); max by date string then numeric N.", "why": "pinned by qa; ignores orchestrator-setup.md and orchestrator.md without a number"},
    {"decision": "--run exits with claude's exit code; a spawn error (claude not on PATH) exits 1 with a message.", "why": "unspecified by tests, sensible default"},
    {"decision": "Genome rule added as one paragraph 'One session per ticket (organism-infra/122)' after 'Partial returns' in .claude/agents/orchestrator.md. Names worktree-gc, handoff, fresh session, next ticket proposal, and says /compact is only for the 80k gate mid-flight.", "why": "AC1"}
  ],
  "failures": [],
  "pending": [
    {"item": "User applies the gated patch: !npm run apply-gated (patch checked with git apply --check against the base: clean). AC1 is human-verified.", "owner": "user"},
    {"item": "qa verify (light), then risk-check and PR", "owner": "qa"}
  ]
}
```

## Notes

- Step 1 of the orchestrator Loop still says "ask the user to run /compact ... Ask for a fresh session only if compaction fails" for the 80k session gate. That stays consistent with the ticket (compaction is the mid-flight fallback), so I did not touch it. The orchestrator may want to reword it later.
