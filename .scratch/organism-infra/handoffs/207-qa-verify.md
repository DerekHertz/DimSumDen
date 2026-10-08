# 207 qa verify (light): dispatch-prompt prints the qa verify mode

Verdict: **QA pass** (light verify). Branch: `feat/207-dispatch-prompt-verify-mode`, checked out detached at `a1f6906` in the worktree.

Verify mode: light (qa specify ran for this ticket: /home/dhertzell/dimsumden/.scratch/organism-infra/handoffs/207-qa-specify.md)

```json
{
  "ticket": "organism-infra/207-dispatch-prompt-prints-verify-mode",
  "cell": "qa",
  "mode": "verify",
  "current_step": "light verify done: pass. Suite 2988/2988 pass, 0 fail, 0 skipped (developer's saved output, not re-run per orchestrator). Specify test file unchanged since 0b14f83. All 4 criteria mapped; criterion 3 human-verified. No out-of-scope files. Ready for the orchestrator to open the PR.",
  "artifacts": [
    "branch feat/207-dispatch-prompt-verify-mode",
    "specify commit 0b14f83",
    "developer commit 5d9655e",
    "gated patch applied commit a1f6906",
    "scripts/dispatch-prompt-verify-mode.test.mjs",
    "/tmp/207-tests.txt"
  ],
  "decisions": [
    "Suite result taken from /tmp/207-tests.txt as the orchestrator instructed; npm test was not re-run. Deviates from light-verify step 1 wording on purpose.",
    "Light verify, no escalation: every step followed the genome rules without judgment.",
    "Scope check: files changed since 0b14f83 are scripts/dispatch-prompt.mjs (ticket scope) and .claude/agents/qa.md (criterion 3, the gated patch the user applied). Both in scope; listed, not judged."
  ],
  "failures": [],
  "pending": []
}
```

## Light-verify steps

1. Suite: `/tmp/207-tests.txt` (developer's full `npm test` output). Summary: `tests 2988`, `pass 2988`, `fail 0`, `skipped 0`, `todo 0`. The 207 verify-mode subtests appear as `ok` in that output (for example, lines 12703 to 12734 for the light and full cases, and 12757 to 12848 for the guards).
2. `git diff 0b14f83 HEAD -- scripts/dispatch-prompt-verify-mode.test.mjs`: empty. No assertion removed or loosened.
3. Criteria:
   - C1, `Verify mode: light` with a qa-specify handoff, `Verify mode: full` otherwise: covered by the `scripts/dispatch-prompt-verify-mode.test.mjs` tests "qa verify with a published 07-qa-specify.md prints one `Verify mode: light` line", "the light line names the qa-specify handoff path", "qa verify with no handoffs at all prints one `Verify mode: full` line", the re-dispatch `-2` test, the other-cell and other-ticket tests, and the file-name test.
   - C2, other cells and modes print no line: 16 guard tests (qa specify, developer, security, architect, designer spec/review/critique/direction, each with and without a handoff). All pass.
   - C3, qa genome verify section follows the printed line: `human-verified` per specify. Diff confirmed in `.claude/agents/qa.md` (6 lines, commit a1f6906).
   - C4, `npm test` green: covered by the suite result in step 1.
4. Files touched outside ticket scope: none. The two files changed since specify are listed above and are both in scope.

## Notes for the orchestrator

- The developer's `scripts/dispatch-prompt.mjs` adds the verify-mode line only for `--cell qa --mode verify`, through `verifyModeLine`. The genome edit tells qa to follow the printed line.
- The `cell-start` warning about orchestrator context at 70k was printed on claim. It is not a qa finding.
