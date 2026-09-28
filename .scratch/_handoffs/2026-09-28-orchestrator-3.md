```json
{"ticket": "none/orchestrator-session", "current_step": "Session ended at 75% 5h usage, by user choice; resume later",
 "artifacts": [".scratch/usage.jsonl", "docs/adr/0009-mechanical-checks-for-most-skipped-rules.md", ".scratch/organism-infra/issues/25-shell-and-git-guidance.md"],
 "decisions": ["usage-watch wrap-up raised to 80% permanently", "every failed call or blocker is logged as an incident", "ADR 0009 accepted: all 5 rules, hard block with logged --force"],
 "failures": [],
 "pending": [{"item": "start the organism-infra/16 relay (worktree lifecycle and a board handoff command)", "owner": "orchestrator"}]}
```

# Handoff: orchestrator, 2026-09-28 (session 3)

**Done:**
- **ci-cd/04:** merged in PR #22.
- **ci-cd/01:** resolved.
- **organism-infra/15:** produced ADR 0009, accepted, and tickets 17–24.
- **organism-infra/17:** schemas, merged in PR #23.
- **organism-infra/18:** board CLI hardening, merged in PR #24 after one security bounce.
- **Handoff skill:** now requires a leading JSON State block.
- **Rule changes:** protocol gained a `Failed calls` rule, usage-watch wraps up at 80%, and the orchestrator logs every failure to `usage.jsonl`. All committed on `main` (d3b7984). Worktrees: only the main checkout.

**Next, in order:** 16 (worktree lifecycle and `board handoff`, the biggest friction win), 25 (shell and git guidance), 24 (board claim ergonomics, plus only the orchestrator resolves), then 21, 20, 19, 22, 23 and 11.

**Dispatch notes (still needed until 16, 24 and 25 land):**
- qa claims must pass `--mode specify|verify`, which 18 enforces.
- Each dispatch prompt says: no background sub-agents, run code-review in the foreground, no interim handbacks, plain single commands, no heredocs for handoffs, and list every failed call.
- A developer bases its work off `origin/<tests-branch>` on its own local branch and pushes with `HEAD:<branch>`.
- Background cells can't use AskUserQuestion, so they return open questions.

**Repo:** the GitHub repo is now `DerekHertz/DimSumDen`, and the old name redirects. Auto-merge is grayed out until you enable "Allow auto-merge" in the repo settings. The classifier also denied my auto-merge and monitor toggles.

**Loose ends:**
- `get_usage` reports the plan as Max, but the skill says Pro. The user hasn't confirmed which is right.
- Stray `.scratch/organism-infra/issues/08-risk-sized-review.md.tmp`, uncommitted.
- PRs #20 and #21 are still unmerged, per the earlier handoff.
