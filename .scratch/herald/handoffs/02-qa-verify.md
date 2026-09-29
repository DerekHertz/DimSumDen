# Handoff: herald/02 light verify (qa)

Verdict: QA pass.

```json
{
  "ticket": "herald/02-herald-genome",
  "cell": "qa",
  "mode": "verify",
  "current_step": "light verify complete, verdict pass",
  "artifacts": ["scripts/draft-check.test.mjs", "scripts/herald-genome.test.mjs", ".claude/agents/herald.md", "docs/agents/herald-voice.md"],
  "decisions": ["15 of 15 herald tests pass, none skipped", "no test file changed between 8bc376f and 8e30269", "criterion 1 -> draft-check tests 1-11; criterion 2 -> genome tests 13-15; criterion 3 (diff for user to apply) human-verified, user approved the commit", "genome matches spec: tools Read, Grep, Glob, Write, Agent, Skill; never-publish section; draft outside repo; reads herald-voice.md"],
  "failures": ["npm test: 810 pass, 5 fail (not ok 17, 18, 19, 20, 24), all browser smoke, expected in cloud"],
  "pending": [{"item": "security review", "owner": "security"}]
}
```

Diff 8bc376f..8e30269 touches only .claude/agents/herald.md, docs/agents/herald-voice.md, scripts/draft-check.mjs. Outside the test files; all within ticket scope.
