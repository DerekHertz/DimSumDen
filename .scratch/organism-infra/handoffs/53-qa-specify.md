```json
{"ticket": "organism-infra/53", "cell": "qa", "mode": "specify", "current_step": "qa specify done: 7 failing tests committed on tests/organism-infra-53-organ-to-station-rename",
 "artifacts": ["scripts/organ-to-station.test.mjs", "tests/organism-infra-53-organ-to-station-rename @ 5c0ce57"],
 "decisions": ["No code in apps/ parses organism.organ (schemas.mjs has no genome schema), so 'schema accepts station:' is tested as genome frontmatter shape: each genome has station: with the design-brief value and no organ: key.", "apps/organism-infra/fixtures/ is skipped (frozen historical ticket copies); design/ and Python under design/3d are out of the ticket's grep scope and untested.", "Allowed leftover 'organ' lines must contain 'was: organ', 'Was (organ)' or 'the old name'.", "ADR record: any docs/adr/*.md containing organ, station, rename and 'pass gate'."],
 "failures": [],
 "pending": [{"item": "Do the rename so scripts/organ-to-station.test.mjs passes; do not edit the test", "owner": "developer"}]}
```

# 53 qa specify handoff

State: done. 7 tests, all red for the right reason (assertions on unrenamed text).

Branch: tests/organism-infra-53-organ-to-station-rename (commit 5c0ce57)
Test file: scripts/organ-to-station.test.mjs (picked up by `npm test`)

## Criterion-to-test map
- Criterion 1 (grep -w organ clean): test 1 (bare organ/organs in .claude, docs/agents, apps, scripts, CLAUDE.md); test 4 (no "Brain/Muscles/Immune/Skin cell|organ" or "(Brain)" style tags; qa.md says "cell of the Tea & Pantry station", orchestrator.md "cell of the Pass station").
- Criterion 2 (station: accepted): tests 2 and 3 (station values pass / steamers / tea-pantry / front-of-house per genome; no organ: key).
- Criterion 3 (Brain gate decision recorded, renamed to Pass gate): test 5 (no "brain gate" anywhere in scope; organism-protocol has "## Pass gates"), test 6 (CLAUDE.md names (Pass), (Steamers), (Tea & Pantry), (Front of House) and "stop at pass gates"), test 7 (an ADR records the rename and Pass gate).
- Human-verified: prose reads naturally after the rename.

## Notes for developer
- Value mapping: orchestrator, product, architect -> pass; developer, scout, debugger -> steamers; qa, security -> tea-pantry; designer -> front-of-house.
- Known hits to fix include apps/ui/assets-src/panda/build_props.py comments ("organ-brain", "organ Brain hue") and the genome body lines.
- Also update CONTEXT.md's Avoid line ("still in genomes and code until organism-infra/53") is outside test scope but stale after this.
- `.claude/` edits are user-gated; the PR merge is that gate.

## Suggested skills
implement, tdd
