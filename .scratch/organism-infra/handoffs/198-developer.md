```json
{
  "ticket": "organism-infra/198-verify-reads-saved-tests",
  "cell": "developer",
  "current_step": "criteria 1, 2 and 4 done and committed (d0f774d on feat/198-verify-reads-saved-tests); criterion 3 is a gated .claude patch the user must apply",
  "artifacts": [
    "branch feat/198-verify-reads-saved-tests",
    "commit d0f774d",
    "scripts/dispatch-prompt.mjs",
    "scripts/jev.mjs (readTests now exported)",
    ".scratch/_handoffs/gated/198-orchestrator-genome.patch"
  ],
  "decisions": [
    "reuse the exposure check by exporting readTests from scripts/jev.mjs and importing it, no copy",
    "printed line: \"Suite result: the developer's full npm test output is saved at <absolute path>. Use it as the suite result; do not re-run the suite.\" Relative --tests paths are resolved against cwd so the cell sees an absolute path",
    "--tests on any cell/mode other than qa verify exits 2 (the ticket scopes it to qa verify; qa's tests left this open)",
    "the file is read once for the check only; its contents are never printed",
    "qa's test file and scripts/dispatch-prompt.test.mjs are untouched"
  ],
  "failures": [
    "npm test: 1 failure unrelated to this ticket, 'Low-80: runJg is refused when checkout param is omitted and root has no .git ancestor' (scripts/jev-hardening.test.mjs). Cause: /tmp/.git exists on this machine, and the test assumes none above mkdtemp in /tmp. A first full run showed a second failure that did not repeat (flaky, not identified)."
  ],
  "pending": [
    { "item": "User applies the gated patch: !npm run apply-gated (patch is 198-orchestrator-genome.patch, passes git apply --check on the base). It edits two lines of .claude/agents/orchestrator.md: the dispatch-prompt signature in step 7 gains [--tests <file>], and stage 3 tells the orchestrator to pass the same <file> to the qa verify dispatch-prompt call.", "owner": "user" },
    { "item": "Light verify against bce8369: diff scripts/dispatch-prompt-tests-flag.test.mjs unchanged, run npm test (expect only the Low-80 /tmp/.git failure)", "owner": "qa" }
  ]
}
```

## What changed

- `scripts/dispatch-prompt.mjs`: new `--tests <file>` value flag. In `parseArgs`, it is allowed only for `--cell qa --mode verify`. In `main`, `readTests` (the `jev.mjs verify --tests` check) runs first; a refusal prints `dispatch-prompt: <reason>` on stderr, nothing on stdout, exit 2. On success one `Suite result:` line is added before the handoff line. USAGE and header comment updated.
- `scripts/jev.mjs`: `readTests` exported. No behavior change.

## Tests

- `node --test scripts/dispatch-prompt-tests-flag.test.mjs scripts/dispatch-prompt.test.mjs scripts/jev.test.mjs`: 83 pass (15 of them qa's new tests, all green).
- `npm test`: 2603 pass, 1 environmental failure (above) on the final run.

## Gated patch (criterion 3)

`/home/dhertzell/dimsumden/.scratch/_handoffs/gated/198-orchestrator-genome.patch`, plain `git diff` of `.claude/agents/orchestrator.md`. The two added sentences:

- Step 7: signature becomes `... [--continue] [--batch <name>] [--tests <file>]`.
- Stage 3, after the `jev.mjs verify --ticket <ref> --tests <file>` sentence: "Pass that same `<file>` to the qa verify dispatch: `node scripts/dispatch-prompt.mjs ... --cell qa --mode verify --tests <file>` prints one `Suite result:` line naming it, so qa uses the saved run instead of sending the full suite to a background scout and ending its turn waiting (organism-infra/198). Paste the line as printed; `--tests` is for qa verify only, and a path the exposure check refuses exits 2."

The user applies it with `!npm run apply-gated` from the main checkout.

## Comments for the orchestrator

- The Low-80 failure needs its own ticket (test should use a root with a guaranteed-no-.git path, or the check should not depend on /tmp). Out of scope here.
- The qa verify cell may also want the qa genome to say "if the prompt has a Suite result line, use it". Not in this ticket; qa follows the dispatch prompt line, so the genome may not need a change.
