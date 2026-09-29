```json
{"ticket": "organism-infra/53", "cell": "developer", "mode": "implement", "current_step": "partial: non-.claude edits committed; .claude/ and CLAUDE.md edits denied by the auto-mode classifier (Self-Modification)",
 "artifacts": ["docs/adr/0012-organ-renamed-station-brain-gate-renamed-pass-gate.md", "CONTEXT.md", "apps/ui/assets-src/panda/build_props.py", "scratchpad rename.mjs (not in repo)"],
 "decisions": ["ADR 0012 records organ -> station and Brain gate -> Pass gate.", "CONTEXT.md: Avoid line, Pass gate, Gate request and Autonomy entries updated.", "build_props.py comments: organ-brain -> station-pass, organ Brain hue -> Pass station hue."],
 "failures": ["node rename.mjs (edits .claude/agents/*.md, .claude/skills/*, CLAUDE.md) refused by the classifier as Self-Modification. Not retried or worked around."],
 "pending": [{"item": "Apply the .claude/ and CLAUDE.md rename (script mapping below), then run npm test", "owner": "user or orchestrator"}]}
```

# 53 developer handoff

State: blocked. Tests in scripts/organ-to-station.test.mjs tests 1-6 still red because they cover .claude/ and CLAUDE.md, which I could not edit. Test 7 (ADR) should now pass; not run.

## Remaining edits (mechanical)
- Frontmatter in the 9 genomes: `organ: muscles|immune|brain|skin` -> `station: steamers|tea-pantry|pass|front-of-house`.
- Prose: "<Muscles|Immune|Brain|Skin> organ/cell/helper" -> "<Steamers|Tea & Pantry|Pass|Front of House> station/cell/helper" (qa.md: "cell of the Tea & Pantry station").
- "brain gate(s)" -> "pass gate(s)", "## Brain gates" -> "## Pass gates" in orchestrator.md, security.md, organism-protocol, usage-watch, implement, to-tickets, VENDORED.md, CLAUDE.md. organism-protocol also "sets your organ," -> "sets your station,".
- CLAUDE.md: (Brain)->(Pass), (Muscles)->(Steamers), (Immune)->(Tea & Pantry), (Skin)->(Front of House), "stop at pass gates".
- The script is at /tmp/claude-1000/-home-dhertzell-dimsumden/b10e94b8-b9aa-455a-a7d2-bb607d09e72b/scratchpad/rename.mjs (regex replacements over those files); it just needs permission to run.

Docs/agents and apps/scripts have no other bare "organ" hits.
