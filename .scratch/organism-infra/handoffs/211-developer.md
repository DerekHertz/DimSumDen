# 211 developer handoff

Branch `feat/211-spend`, commit 6d25977 on top of qa's tests (af32338). All 21 qa tests pass untouched; full `npm test` green (3123 pass, 0 fail).

```json
{
  "ticket": "organism-infra/211-track-orchestrator-and-cell-spend",
  "cell": "developer",
  "current_step": "Implemented and committed; qa tests pass, full suite green. Gated patch for the orchestrator genome written.",
  "artifacts": [
    "scripts/spend-lib.mjs",
    "scripts/spend-log.mjs",
    "scripts/spend.mjs",
    "scripts/log-cell.mjs",
    "package.json",
    ".scratch/_handoffs/gated/211-orchestrator-spend-log.patch"
  ],
  "decisions": [
    "Shared helpers live in scripts/spend-lib.mjs (transcript totals, per-session delta, O_NOFOLLOW append) and are used by spend-log.mjs and log-cell.mjs.",
    "log-cell validates --transcript before any write; the cell row gets the full transcript totals, the spend row only the delta (so a repeat run adds no spend).",
    "A negative delta (transcript shrank) clamps to zero per field.",
    "spend.mjs text mode sorts by total descending; --json as pinned by qa.",
    "Genome line delivered as a gated patch (touches .claude/agents/orchestrator.md): run spend-log at each usage check and at handoff, pass --transcript to log-cell."
  ],
  "failures": [],
  "pending": [
    {
      "item": "User applies the gated patch with !npm run apply-gated (211-orchestrator-spend-log.patch)",
      "owner": "orchestrator"
    },
    {
      "item": "Light verify of branch feat/211-spend; human-verified item: the genome line is in the patch",
      "owner": "qa"
    }
  ]
}
```

## Notes

- The orchestrator must still locate its own transcript path (`~/.claude/projects/<project>/<session>.jsonl`) and each subagent's (`<session>/subagents/agent-<id>.jsonl`); no auto-discovery was built (not in scope).
- The cell row's `tokens` field is untouched; whether to drop it later is open.
