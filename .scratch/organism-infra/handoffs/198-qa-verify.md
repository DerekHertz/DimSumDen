```json
{
  "ticket": "organism-infra/198-verify-reads-saved-tests",
  "cell": "qa",
  "mode": "verify",
  "current_step": "full verify done on feat/198-verify-reads-saved-tests at a3ead5a: QA pass. Criteria 1, 2 and 4 covered by passing tests; criterion 3 human-verified (gated). Suite result from /tmp/198-tests.txt: 2605 pass, 0 fail, 0 skipped, 0 todo (not re-run).",
  "artifacts": [
    "branch feat/198-verify-reads-saved-tests, head a3ead5a (specify bce8369, developer d0f774d, genome commit a3ead5a)",
    "scripts/dispatch-prompt-tests-flag.test.mjs (specify tests, unchanged since bce8369)",
    "scripts/dispatch-prompt.mjs, scripts/jev.mjs (readTests exported)",
    ".claude/agents/orchestrator.md (gated path, changed on the branch; see failures)"
  ],
  "decisions": [
    "full verify, not light: this qa cell did not run specify for 198 (specify was bce8369, by another qa cell)",
    "suite result taken from /tmp/198-tests.txt as the orchestrator directed; npm test not re-run",
    "criterion 3 stays human-verified (specify marked it so); no automated test",
    "implementation read against the ticket: no findings"
  ],
  "failures": [
    ".claude/agents/orchestrator.md:41 and :52 changed in commit a3ead5a on the branch, while the developer handoff and the gated-patch rule say that change is a patch only. The gated patch .scratch/_handoffs/gated/198-orchestrator-genome.patch carries the same blob change (593b41d..e87984b), so the change would be applied twice if both paths are used. Listed, not judged: security and the orchestrator decide."
  ],
  "pending": [
    {
      "item": "Decide whether the orchestrator.md change ships on the branch or via the gated patch, not both, and review the gate breach in a3ead5a. Then the user applies the chosen path (criterion 3, human-verified).",
      "owner": "orchestrator"
    }
  ]
}
```

## Verdict

QA pass (full verify), branch `feat/198-verify-reads-saved-tests` at `a3ead5a`.

## Criterion-to-test map

Test file: `scripts/dispatch-prompt-tests-flag.test.mjs`. Test numbers are from the saved suite output `/tmp/198-tests.txt`. All of them are `ok`.

1. `dispatch-prompt.mjs --cell qa --mode verify --tests <file>` prints a line naming the file. Covered by lines 59, 67, 77, 85, 91 and 106 (tests 1297 to 1303). Checks: exit 0, exactly one line naming the file, the line says "suite" and "use", a relative path resolves, file contents are not echoed, the usual qa verify lines remain, and a file of exactly 1 MB is accepted.
2. A path the exposure check refuses exits 2. Covered by lines 122, 130, 137, 144, 149, 156, 160 and 164 (tests 1304 to 1311). Cases: hidden directory, hidden file, symlink, over 1 MB, `.env`, missing file, directory, and `--tests` with no value. Each asserts exit 2, empty stdout and a stderr reason.
3. The orchestrator genome stage 3 passes the same file. Human-verified per specify. The change is a gated `.claude` edit that the user applies.
4. `npm test` green. Saved run: 2605 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo.

## Checks run

- Specify test file unchanged: `git diff bce8369 HEAD -- scripts/dispatch-prompt-tests-flag.test.mjs` is empty.
- Branch's own changes against its fork point `3754615`: four files. `scripts/dispatch-prompt-tests-flag.test.mjs` (test), `scripts/dispatch-prompt.mjs` (in scope), `scripts/jev.mjs` (export only, in scope because dispatch-prompt imports `readTests`), and `.claude/agents/orchestrator.md` (gated path, see failures).
- Implementation read: `readTests` runs before the ticket lookup, so a refused path exits 2 with empty stdout. `--tests` is refused on any cell or mode other than qa verify. The printed path is absolute, and file contents are never printed. No findings.
- Count mismatch, not a bounce: the developer handoff reports 2603 pass plus one environmental failure (`Low-80`, `/tmp/.git`). The saved run reports 2605 pass and 0 fail.
- The branch is behind `main`. Diffing against the `main` tip shows main's newer commits as deletions. The branch's own change is the four files above.

## Notes for the orchestrator

- The `Low-80` /tmp/.git failure belongs in its own ticket, as the developer said. It did not fail in the saved run.
- The qa verify genome does not need a change. The dispatch prompt's `Suite result:` line is enough.
