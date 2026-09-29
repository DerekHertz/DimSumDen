# Handoff: 37 fix round (developer)

Removed `debugger` as a cell type outside ADRs, `.claude/` and historical `.scratch`.

```json
{
  "ticket": "organism-infra/37-trim-genome-tools",
  "cell": "developer",
  "current_step": "in-review",
  "artifacts": [
    "branch organism-infra/37-trim-genomes @ ec66136 (pushed)",
    "apps/organism-infra/board-service.mjs",
    "scripts/log-cell.mjs",
    "apps/ui/src/scene/roam.mjs",
    "apps/ui/src/scene/banquet-layout.mjs",
    "README.md"
  ],
  "decisions": [
    "README says nine roles and Steamers are developer and scout",
    "Roam HOMES entry for debugger deleted; no other homes moved",
    "Tests updated in roam, banquet-layout, scene-from-state, organ-to-station, usage-rows comment"
  ],
  "failures": [
    "git checkout refused: branch registered to a vanished scratchpad worktree wt10; fixed with git worktree prune",
    "npm test: 831/832 pass; only smoke:ui fails (Google Fonts ERR_CERT_AUTHORITY_INVALID, accepted cloud failure)"
  ],
  "pending": [
    {"item": "Review and merge the branch", "owner": "orchestrator"},
    {"item": "Historical .scratch and ADR mentions of debugger left as-is", "owner": "orchestrator"}
  ]
}
```
