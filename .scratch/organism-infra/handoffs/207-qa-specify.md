```json
{
  "ticket": "organism-infra/207-dispatch-prompt-prints-verify-mode",
  "cell": "qa",
  "mode": "specify",
  "current_step": "specify done: 25 tests in one new file, 9 failing for the missing feature (assertion failures, not setup errors) and 16 regression guards passing; committed on feat/207-dispatch-prompt-verify-mode at 0b14f83; developer next",
  "artifacts": [
    "branch feat/207-dispatch-prompt-verify-mode",
    "commit 0b14f83",
    "scripts/dispatch-prompt-verify-mode.test.mjs"
  ],
  "decisions": [
    "new test file rather than editing scripts/dispatch-prompt.test.mjs, so verify can diff-check the 147 tests untouched",
    "mode line starts with 'Verify mode: light' or 'Verify mode: full'; exactly one line matching /verify mode/i is printed for qa verify",
    "light = a published .scratch/<feature>/handoffs/<NN>-qa-specify.md or <NN>-qa-specify-<k>.md exists, where NN is the ticket number; the light line includes the absolute path of the handoff",
    "not light: other cells' handoffs (developer, orchestrator, security, qa-verify), other tickets' qa-specify (08-, 107-, 17-), and non-handoff names like 07-qa-specify-notes.txt; the number must match exactly, so 107- must not satisfy 07",
    "the full line does not mention light; wording after the first words is not pinned beyond the handoff path in the light line",
    "--continue and --tests do not change the mode",
    "negative guards: qa specify, developer, security, architect, designer spec/review/critique/direction print no 'verify mode' line, with and without a qa-specify handoff present (they pass today and must keep passing)",
    "developer should reuse handoffName-style readdir logic rather than a second regex dialect; tests do not require sharing"
  ],
  "failures": [],
  "pending": [
    { "item": "In scripts/dispatch-prompt.mjs, for --cell qa --mode verify only, look for <NN>-qa-specify[-k].md in the ticket's handoffs dir and print 'Verify mode: light (qa specify ran for this ticket: <handoff path>)' or 'Verify mode: full'; update the header comment", "owner": "developer" },
    { "item": "Criterion 3: the qa genome verify section follows the printed line instead of inferring the mode. Gated .claude edit: put the exact diff in the developer handoff (and as a patch under .scratch/_handoffs/gated/207-qa-genome.patch) for the user to apply", "owner": "developer" }
  ]
}
```

## Criterion-to-test map (scripts/dispatch-prompt-verify-mode.test.mjs)

1. qa verify prints `Verify mode: light` with a qa-specify handoff, `Verify mode: full` otherwise:
   - "qa verify with a published 07-qa-specify.md prints one `Verify mode: light` line"
   - "the light line names the qa-specify handoff path"
   - "qa verify with no handoffs at all prints one `Verify mode: full` line"
   - "a re-dispatched specify handoff (07-qa-specify-2.md, no plain name) still counts as light"
   - "other cells' handoffs on this ticket do not make it light ..."
   - "another ticket's qa-specify handoff does not make this one light (08- and 107-)"
   - "a file that merely contains 'qa-specify' in its name ... does not count"
   - "the mode line works alongside --tests and the usual verify lines"
   - "the mode is decided from handoffs alone: --continue does not change it"
2. Other cells and modes print no such line: 16 guard tests (8 cell/mode combos, each with and without a specify handoff). They pass today by design.
3. Qa genome edit as an exact diff in the developer handoff: human-verified (gated `.claude/` file, applied by the user).
4. `npm test` green: run by verify.

## Run

`node --test scripts/dispatch-prompt-verify-mode.test.mjs`: 25 tests, 16 pass, 9 fail. All 9 fail on `AssertionError` because no 'Verify mode' line is printed yet.

## Notes for verify

The 16 guards passing before the feature is expected; verify should check none were removed or loosened.
