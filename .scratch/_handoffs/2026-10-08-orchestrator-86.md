# Orchestrator handoff 86 (2026-10-08)

## State
- **Resolved: organism-infra/208** (context-budget hook). PR #203 merged at ba4300f on green CI. Most of the hook already existed (162/145/165/194). The user settled the scope after qa specify: developer and qa lowered to warn 70k / stop 80k, the warning fires once per cell, and `log-cell` plus `/tmp` writes are allowed at the stop. A scout's live probe found that the hook reads real context in worktree subagents. Relay: qa specify (13 tests) → developer (Sonnet, 76k tokens; it skipped /code-review at 71.6k) → the user applied the gated organism-protocol patch (30bf95e) → qa light verify on Haiku: pass → risk-check 3 hits → security pass (3 low findings, none blocking: the `/tmp` symlink write-through could be closed with realpath, and the warn markers are never cleaned up). Worktrees gc'd.
- **Before/after test:** 208 is merged, so the after window starts now. Once 10 more tickets resolve, pipeline-retro reruns the baseline query (comments on 207/208).
- **Retro** row logged. 429s went to 167. The developer skipping /code-review past the warn line is being watched: if it recurs, move code-review into its own relay hop (a code fix).
- **apply-gated tip:** `ln -sfn <worktree> /tmp/wNNN`, then `! echo y | npm run apply-gated -- --root /tmp/wNNN` keeps the command short. The stale 136 patch fails its check and is skipped.
- **Usage API** returned 429 at most checks this session. Rows log null with a note when that happens.

## Next
1. Fresh session. Frontier picks: organism-infra/167 (P1, usage 429 backoff; the retro picked it) or den-v1/09 (P1, Demo mode; the designer spec runs in a terminal with the user: `claude --agent designer`). Then den-v1/12 (P3).
