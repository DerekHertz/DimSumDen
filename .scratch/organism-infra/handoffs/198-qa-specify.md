```json
{
  "ticket": "organism-infra/198-verify-reads-saved-tests",
  "cell": "qa",
  "mode": "specify",
  "current_step": "specify done: 15 tests in one new file, 14 failing for the missing feature and 1 regression guard passing, committed on feat/198-verify-reads-saved-tests at bce8369672bb42d7226b677df5ede0c530e352d6; developer next",
  "artifacts": [
    "branch feat/198-verify-reads-saved-tests",
    "commit bce8369672bb42d7226b677df5ede0c530e352d6",
    "scripts/dispatch-prompt-tests-flag.test.mjs"
  ],
  "decisions": [
    "new test file rather than editing scripts/dispatch-prompt.test.mjs, so verify can diff-check the 147 tests untouched",
    "the line naming the file must contain the path (exactly one such line), the word 'suite', and the word 'use'; the file's contents are never echoed",
    "relative --tests paths resolve against cwd; the printed line still contains the given name",
    "a file of exactly 1 MB is accepted; over 1 MB is refused, matching jev.mjs readTests (size > 1024*1024)",
    "refusals (hidden dir, hidden file, symlink, over 1 MB, .env, missing file, directory, no value) exit 2 with empty stdout and a stderr reason that is not 'unknown argument'; that last assertion keeps them failing now for the right reason",
    "developer should reuse the exposure check, ideally by sharing readTests logic with jev.mjs (export it) rather than copying it; tests do not require sharing",
    "assumption: --tests applies to qa verify; behavior of --tests on other cells is not pinned (reject or ignore both pass)"
  ],
  "failures": [],
  "pending": [
    { "item": "Add --tests <file> to scripts/dispatch-prompt.mjs (parseArgs, USAGE, header comment): run the jev exposure check, exit 2 on refusal, print one line naming the file that tells qa to use it as the suite result", "owner": "developer" },
    { "item": "Criterion 3: orchestrator genome stage 3 passes the same file to jev verify and dispatch-prompt. Gated .claude edit: write a patch to .scratch/_handoffs/gated/198-orchestrator-genome.patch for the user to apply", "owner": "developer" }
  ]
}
```

## Criterion-to-test map (scripts/dispatch-prompt-tests-flag.test.mjs)

1. `--cell qa --mode verify --tests <file>` prints a line naming the file:
   - "--tests <file>: exits 0 and prints a line that names the file"
   - "--tests <file>: the line tells qa to use the file as the suite result"
   - "--tests <relative path>: resolved against the working directory, the line still names the file"
   - "--tests <file>: the file's contents are not echoed into the prompt"
   - "--tests <file>: the usual qa verify lines are all still there"
   - "a file of exactly 1 MB is accepted (the limit is 'over 1 MB')"
   - regression guard (passes today): "without --tests: no line about a saved suite result"
2. A refused path exits 2 (stdout empty, stderr has the reason):
   - hidden directory, hidden file, symlink to an allowed file, over 1 MB, `.env` file, missing file, directory, `--tests` with no value (8 tests, one each)
3. Orchestrator genome stage 3: human-verified (gated .claude edit applied by the user; no test).
4. `npm test` green: whole suite, checked at verify.

## Notes for verify

Light verify applies (qa specified). Diff `bce8369` against HEAD for `scripts/dispatch-prompt-tests-flag.test.mjs`. The existing `scripts/dispatch-prompt.test.mjs` should be unchanged.
