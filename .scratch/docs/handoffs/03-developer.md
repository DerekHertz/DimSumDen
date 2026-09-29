# Handoff: docs/03-claude-md-refresh (developer)

Proposed CLAUDE.md is at `docs/agents/CLAUDE.proposed.md` on branch `docs/03-claude-md-refresh` (41 lines). The orchestrator copies it over `CLAUDE.md` (gated).

Claims checked against main (98b1993):
- Scripts: test, board, ui, ui:build, bridge, smoke:ui, risk-check all exist in package.json.
- apps/: ui, bridge, organism-infra, ci-cd exist; scripts/ holds relay tooling.
- Genomes: architect, debugger, designer, developer, herald, orchestrator, product, qa, scout, security. Stations from each genome's `station:` field (herald is front-of-house).
- Relay: light verify in qa.md and orchestrator step 3; risk-check in orchestrator step 4; security only on a hit.
- Relay autonomy text and its stop list match organism-protocol.
- `max_concurrent_cells: 2` in orchestrator.md.
- cloud-sessions.md covers PW_CHROMIUM_PATH; usage estimate from scripts/usage.mjs (usage-watch skill).

```json
{
  "ticket": "docs/03-claude-md-refresh",
  "cell": "developer",
  "current_step": "done: proposal committed and pushed, awaiting orchestrator apply",
  "artifacts": ["docs/agents/CLAUDE.proposed.md", "branch docs/03-claude-md-refresh @ 11fe303"],
  "decisions": [
    "41 lines, one over the ~40 target; kept the old shape and token-hygiene tone",
    "Kept CONTEXT.md terms (cell, genome, station)"
  ],
  "failures": ["A first Bash attempt hung on a stray `cat > file` reading stdin (my error); redone with Write"],
  "pending": [{"item": "Copy docs/agents/CLAUDE.proposed.md over CLAUDE.md and decide whether to delete the proposal file", "owner": "orchestrator"}]
}
```
