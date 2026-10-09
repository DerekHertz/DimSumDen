# Handoff: 211 security review

```json
{
  "ticket": "organism-infra/211-track-orchestrator-and-cell-spend",
  "cell": "security",
  "current_step": "Security pass. Diff origin/main..4ff113d reviewed by hand; gitleaks clean; no new dependencies.",
  "artifacts": [],
  "decisions": [
    "Verdict: pass. No critical or high findings.",
    "No new or upgraded dependency (package.json only adds an npm script), so no audit gate."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Orchestrator opens the PR and merges on green CI",
      "owner": "orchestrator"
    }
  ]
}
```

## Findings (all non-blocking)

- scripts/spend-lib.mjs:49-52 (spendDelta then appendUsageRows in spend-log.mjs:55-66 and log-cell.mjs:145-158), low: read-then-append is not atomic, so two concurrent runs for one session could both log the same delta (double count). Spend accounting only; relay runs one orchestrator per session.
- scripts/spend-lib.mjs:17, low: `--transcript` takes any readable file path and statSync follows symlinks. Only four numeric fields are read and nothing from the file is echoed, so there is no content disclosure. Trusted local CLI args.
- scripts/spend-log.mjs:25-27, low: `--session` is free text (length-capped, JSON-serialized into the row, no injection). A caller can mislabel or inflate spend; local trust only.
- .claude/agents/orchestrator.md (commit 4ff113d), info: genome edit is on the branch as a user-authored commit (the applied gated patch); the patch file 211-orchestrator-spend-log.patch is not under gated/applied. Orchestrator should confirm the user applied it, or tidy the patch file.

## Checked and clean

- Writes to usage.jsonl use O_NOFOLLOW and refuse a symlinked .scratch (spend-lib.mjs:55-70); same pattern as log-cell.
- `--ticket` is resolved via resolveShortRef, matched against REF_RE, rejects `..`, and must exist on the board, so no path traversal. `--role` is allow-listed.
- No shell-outs, no network, no daemon exposure; parse errors in transcripts are skipped, not executed.
- gitleaks detect over origin/main..HEAD (3 commits): no leaks.
