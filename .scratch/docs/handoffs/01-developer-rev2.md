# Handoff: docs/01-readme (developer, revision)

```json
{
  "ticket": "docs/01-readme",
  "cell": "developer",
  "current_step": "Revision committed and pushed on docs/01-readme; main merged in (LICENSE present); awaiting review",
  "artifacts": ["README.md", "branch docs/01-readme @ 9ac0479"],
  "decisions": [
    "README uses agents, roles, role definitions, team; dim-sum station framing introduced once in The problem, CONTEXT.md linked as glossary",
    "Added 'Where this is going' section: goal is all agent interaction through the den UI; today UI shows live state and files gate approve/reject requests, dispatch still runs from the orchestrator session",
    "All numbers and sources kept unchanged (85/11 commits at 69a4a57, 78 test files, 52 runs/14 tickets/3.04M tokens/194 min); 'cell runs' reworded to 'agent runs', kind:\"cell\" data field name kept as literal",
    "The Read more glossary line still lists CONTEXT.md's own terms (organism, cell, genome) as a pointer, not as working vocabulary"
  ],
  "failures": [],
  "pending": [
    {"item": "User approval of README", "owner": "user"},
    {"item": "Merge to main", "owner": "orchestrator"},
    {"item": "CLAUDE.md still says 'No app code exists yet'; stale", "owner": "orchestrator"}
  ]
}
```
