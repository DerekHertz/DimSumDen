```json
{
  "ticket": "organism-infra/207-dispatch-prompt-prints-verify-mode",
  "cell": "developer",
  "current_step": "implemented and committed at 5d9655e on feat/207-dispatch-prompt-verify-mode; qa's 25 tests green, dispatch-prompt.test.mjs untouched and green, full npm test 2988 pass 0 fail; qa genome edit written as a gated patch",
  "artifacts": [
    "branch feat/207-dispatch-prompt-verify-mode",
    "commit 5d9655e",
    "scripts/dispatch-prompt.mjs",
    ".scratch/_handoffs/gated/207-qa-genome.patch"
  ],
  "decisions": [
    "extracted maxHandoff(dir, stem) from handoffName so the mode check reuses the same readdir and regex logic (no second dialect); handoffName behaviour unchanged",
    "verifyModeLine(dir, num) prints 'Verify mode: light (qa specify ran for this ticket: <abs path of the highest-numbered qa-specify handoff>)' or 'Verify mode: full (no qa specify handoff for this ticket)'; only for --cell qa --mode verify",
    "genome wording: the verify section opens with a rule to follow the printed line and not infer from history; a missing line means full verify"
  ],
  "failures": [],
  "pending": [
    { "item": "User applies the qa genome patch: !npm run apply-gated (patch .scratch/_handoffs/gated/207-qa-genome.patch, diff below)", "owner": "orchestrator" },
    { "item": "qa verify (light: qa specified), then risk-check, PR and merge", "owner": "qa" }
  ]
}
```

## Criterion map

1. light/full line: scripts/dispatch-prompt-verify-mode.test.mjs (9 feature tests, all green).
2. no line for other cells/modes: 16 guard tests, green.
3. gated genome diff: below and in the patch file; `git apply --check` passes against this branch.
4. `npm test`: 2988 pass, 0 fail, 0 skipped.

## Exact genome diff (.claude/agents/qa.md)

```diff
--- a/.claude/agents/qa.md
+++ b/.claude/agents/qa.md
@@ -31,6 +31,8 @@
 ## verify (after the developer)
 
-**Light verify** (you ran `specify` for this ticket). It may run on haiku, its minimum tier (ADR 0010), so follow these steps exactly and no more:
+Your dispatch prompt prints one line, `Verify mode: light` or `Verify mode: full`. Follow that line. Don't infer the mode from your own history: a light line means a qa specify handoff is published for this ticket, and it names the handoff. If the prompt has no such line, run full verify.
+
+**Light verify** (`Verify mode: light`). It may run on haiku, its minimum tier (ADR 0010), so follow these steps exactly and no more:
 1. Run `npm test` in the worktree. ...
@@ -37,7 +39,7 @@
 ...
-**Full verify** (you didn't write the tests): the steps below.
+**Full verify** (`Verify mode: full`, or no mode line): the steps below.
```

The patch file has the complete hunks with context lines.

## Notes

The orchestrator should paste the dispatch-prompt output (now including the mode line) into qa verify prompts. Until the user applies the patch, the genome still says to infer the mode.
