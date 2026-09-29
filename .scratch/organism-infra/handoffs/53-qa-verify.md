```json
{"ticket": "organism-infra/53-organ-to-station-rename", "cell": "qa", "mode": "verify",
 "current_step": "qa verify: pass",
 "artifacts": ["feat/organism-infra-53-organ-to-station-rename @ c20c001"],
 "decisions": ["QA pass: npm test 651 pass, 0 fail, 0 skipped", "git diff 5c0ce57 HEAD on scripts/organ-to-station.test.mjs is empty (tests untouched)"],
 "failures": [],
 "pending": [{"item": "security review", "owner": "security"}]}
```

# 53 qa verify

QA pass. npm test: 651 pass, 0 fail, 0 skipped. Specify tests unchanged.

Criterion map:
- grep -rniw organ over .claude, docs/agents, apps, scripts, CLAUDE.md: only hits are in the qa test file itself (comments and regexes). Test: "no bare word organ..." (line 65).
- Genome schema accepts station: no code in apps/ parses organism.organ (no station/organ reference in schemas.mjs); tests "every genome declares organism.station" (69) and "no genome keeps organ:" (76) cover the frontmatter.
- Brain gate decision recorded: user chose Pass gate; new ADR 0012 records it; tests at lines 90 and 105.

Out-of-scope-looking files touched (listed, not judged): apps/ui/assets-src/panda/build_props.py (prose rename in a script; ticket names asset code), CONTEXT.md (ticket says already done, diff shows 8 lines changed), .claude/skills/VENDORED.md.

jg vs grep: jg 0 calls, grep 4 calls.
