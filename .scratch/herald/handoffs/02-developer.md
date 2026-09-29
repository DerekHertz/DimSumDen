# Handoff: herald/02 developer

Apply command (needs the user's permission, `.claude/` gate). Run from the repo root after merging the branch:

`node -e "require('fs').copyFileSync('docs/agents/herald-genome.proposed.md','.claude/agents/herald.md')"`

The 4 genome tests stay red until this is applied. Then delete `docs/agents/herald-genome.proposed.md` (or keep it out of the merge).

```json
{
  "ticket": "herald/02-herald-genome",
  "cell": "developer",
  "current_step": "draft-check implemented and green; genome proposed, awaiting user apply; in-review",
  "artifacts": [
    "branch herald/02-herald-genome @ 7f38b21 (pushed), base 8bc376f",
    "scripts/draft-check.mjs",
    "docs/agents/herald-genome.proposed.md"
  ],
  "decisions": [
    "checkDraft(text) returns violations; also a CLI: node scripts/draft-check.mjs <file>, exit 1 on violations.",
    "Genome tools: Read, Grep, Glob, Write, Agent, Skill. It runs draft-check via scout since it has no Bash.",
    "Genome references docs/agents/herald-voice.md, which does not exist on this branch (another ticket presumably).",
    "Genome extras not covered by qa tests: effort low, color yellow, isolation worktree, skills organism-protocol. Adjust freely."
  ],
  "failures": [
    "npm test: 806 pass, 9 fail. 4 are the herald genome tests (expected red until applied). 5 are smoke tests (smoke --url, smoke:ui, smoke) which need a browser and are unrelated to this change."
  ],
  "pending": [
    {"item": "Apply the genome copy command with user permission", "owner": "orchestrator"},
    {"item": "Confirm herald-voice.md exists before herald runs", "owner": "orchestrator"},
    {"item": "Verify genome tests go green after apply", "owner": "qa"}
  ]
}
```
