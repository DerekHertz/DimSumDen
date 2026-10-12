# Handoff: queue/03-admission-gate (qa verify, light, second pass)

```json
{
  "ticket": "queue/03-admission-gate",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify on b9b5403 (developer impl, on top of specify 4df65d9): QA pass. Steps 1, 2, 3 and 4 clean. Criterion 4 scope settled by the user ruling (createTicket is the write surface; no board create subcommand). Criterion 6 stays human-verified.",
  "artifacts": [
    "branch tests/queue-03-admission-gate (verified at b9b5403; specify sha 4df65d9; base 0046e7e)",
    "apps/organism-infra/admission-gate.test.mjs (unchanged since 4df65d9)"
  ],
  "decisions": [
    "Dispatch said do not re-run the suite and use the developer's saved output. Step 1 was read from /tmp/claude-1000/-home-dhertzell-dimsumden/e80ce5e2-9ba4-4603-b81c-6aeb564d4bd9/scratchpad/03-tests.txt. The genome's light step 1 says run npm test; the conflict is the same as in the first verify. Not re-run here.",
    "Criterion 4 is mapped to createTicket tests only, as the reworded criterion now says. The ticket Comments carry the user ruling of 2026-10-12."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Full security review on b9b5403 (ticket is Security: full). Scope named by the developer: spec path handling in readSpecHeadings and checkServes (frontier-queue.mjs), and the gate park path in board.mjs.",
      "owner": "security"
    }
  ]
}
```

## Verdict

QA pass (light verify).

## Light verify results

1. Suite, from the saved output (not re-run): `# tests 4360`, `# pass 4360`, `# fail 0`, `# cancelled 0`, `# skipped 0`, `# todo 0`. No `not ok` lines. The 33 admission-gate tests are the 33 `test(` calls in the file. None is skipped.
2. `git diff 4df65d9 HEAD -- apps/organism-infra/admission-gate.test.mjs` is empty. No assertion removed, weakened or changed.
3. Criterion to test map (apps/organism-infra/admission-gate.test.mjs):
   - 1. checkAdmission admits and refuses per spec decisions 6 and 7, with reasons: lines 102, 108, 112, 117, 121, 127, 135, 144, 155, 173, 179. Also loadSnapshot-with-checkAdmission at 234, 268, 280.
   - 2. Pipeline ticket blocking an active-feature ticket is admitted without three incidents (ADR 0019 decision 8): lines 159, 167, 300.
   - 3. `board gate` dry run writes nothing; `--apply` parks with reasons: lines 420, 443, 459, 488, 502.
   - 4. createTicket writes Class, Origin and Serves, and refuses a P0 with no reason (reworded; no CLI subcommand required): lines 547, 568, 578, 590, 605, 620.
   - 5. A spec path cannot make the gate read outside .scratch/: lines 334, 342, 363.
   - 6. Real usage.jsonl count: human-verified (ticket Comments, user ruling 2026-10-12). Developer reports 0 of 10 ready organism-infra tickets pass the three-incidents rule. Not re-counted by qa.
4. Files changed since 0046e7e, all in ticket scope, none outside it:
   - apps/organism-infra/admission-gate.test.mjs
   - apps/organism-infra/board-service.mjs
   - apps/organism-infra/board.mjs
   - apps/organism-infra/frontier-queue.mjs

## Notes (observations, not bounces)

- Developer's handoff reports 18 ready tickets refused on day one (specify said 13; the board changed in between).
- Developer flags that the same-tool rule is loose: tool "other" is 122 of 482 incident rows, so three "other" incidents pass. Spec-level choice for the user.
- Gate parks are recognised by the reason prefix "admission gate: ". Security owns that review.
