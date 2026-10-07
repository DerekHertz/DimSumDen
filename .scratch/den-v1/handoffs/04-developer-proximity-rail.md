```json
{
  "ticket": "den-v1/04-proximity-card",
  "cell": "developer",
  "current_step": "Mobile rail header overlap fixed at 0f891dc; build passed, targeted QA next",
  "artifacts": [
    "apps/ui/src/scene/procedural/den.css"
  ],
  "decisions": [
    "Keep capped mobile rail cards at full height and scroll the rail rather than shrink card headers"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Verify mobile queue to Needs-you switching and placement",
      "owner": "qa"
    },
    {
      "item": "Security review after risk-check hits",
      "owner": "security"
    },
    {
      "item": "Final head CI and user visual review before merge",
      "owner": "orchestrator"
    }
  ]
}
```

State: done for developer fix.

What changed: codex/den-v1-04-proximity-card, 0f891dc. Added mobile-only flex-shrink:0 to rail cards, preserving header height inside the capped scrolling rail. Fixes QA finding in 04-qa-proximity-placement.md.

Validation: npm run ui:build passed; git diff --check passed. Build retains existing large-bundle warning. No dependency change. Targeted browser QA follows. Previous focused checks and full-suite limitations remain in earlier handoffs.

Next step: qa verifies real free-cursor queue/Needs-you switches at 375x667 and placement. Security and final head CI follow.

Suggested skills: organism-protocol, handoff.

Gotchas: Mobile cards intentionally use one-open accordion; do not require simultaneous expanded panels.

Failed calls: none in this fix round. Earlier failed calls are retained in prior handoffs.
Worktree receipt: /workspace/DimSumDen-proximity clean after commit. Final context: null.
