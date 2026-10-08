# 208 qa verify (light)

Branch `feat/208-cell-context-hook`, HEAD `30bf95e` (developer commit `ee0d6ff`, gated patch applied in `30bf95e`). Specify commit `83d3e27`. Dispatch line: `Verify mode: light`, against the qa specify handoff `208-qa-specify.md`.

Verdict: **QA pass** (posted as `board comment --verdict pass`).

## Light verify steps

1. Suite: not re-run, per the dispatch. Used `/tmp/208-tests.txt`: 2997 pass, 0 fail, 0 skipped, 0 todo. That run came from the developer's tree before `30bf95e`. `30bf95e` changes one line of `.claude/skills/organism-protocol/SKILL.md` in the wording of the "Context budget" paragraph. The only test that reads that file (`scripts/organ-to-station.test.mjs:92`) checks just the `## Pass gates` heading, so the saved result still applies.
2. `git diff 83d3e27 HEAD -- scripts/hooks/context-budget.208.test.mjs` is empty. No removed or loosened assertion in my test file. All 13 tests show `ok` in the saved output.
3. Criterion to test map:
   - AC1, refusal of Edit, Write outside /tmp, Read, Bash with a message that says how to wrap up: `scripts/hooks/context-budget.test.mjs` ("at exactly 80k ... Read", "... Grep, a Glob and a non-wrap-up Bash", "the refusal message says how to wrap up"); 208 file "at 95k a Write outside /tmp is refused", "at 95k a Read of a /tmp file is still refused".
   - AC2, wrap-up commands still run: 208 file "at 95k node scripts/log-cell.mjs is allowed", "at 95k log-cell chained with another command is still refused", "at 95k a Write or Edit of a handoff draft under /tmp is allowed".
   - AC3, one warning at 70k to 80k, not refused: 208 file "between 70k and 80k the first call gets the checkpoint warning and the second call is silent", "the one-time warning is not re-sent when context grows...", "a cell that was warned is still refused once it crosses 80k".
   - AC4, orchestrator never refused: existing orchestrator tests in `scripts/hooks/context-budget.test.mjs` and `scripts/hooks/context-budget.handback.test.mjs`.
   - AC5, fails open when context cannot be read: existing "null context" and "unreadable or empty hook input" tests.
   - AC6, settings.json diff in the handoff: human-verified (marked so at specify). The PreToolUse registration already exists in `.claude/settings.json` from 162. `.claude/settings.json` is not in the `83d3e27..HEAD` diff.
   - AC7, `npm test` green: suite result in step 1.
4. Files the diff touches outside the 208 test file (listed, not judged):
   - `.claude/skills/organism-protocol/SKILL.md`: 1 line, the gated patch, applied in `30bf95e`.
   - `scripts/context-budget.json`: developer and qa to 70k/80k (scope the user settled).
   - `scripts/hooks/context-budget.mjs`: the hook change (the ticket's code).
   - Six older test files whose assertions the developer changed to match the new behavior:
     - `scripts/context-budget.test.mjs` (12 lines)
     - `scripts/context-cell-state.test.mjs` (24)
     - `scripts/hooks/context-budget.handback.test.mjs` (6)
     - `scripts/hooks/context-budget.scratchpad.test.mjs` (9)
     - `scripts/hooks/context-budget.test.mjs` (7)
     - `scripts/hooks/context-budget.tiers.test.mjs` (31)

   These are not my specify test files, so the light rule does not bounce them. I did not check whether any assertion became looser. The developer's handoff says the edits follow the 70k/80k thresholds, the silent repeat warning, and the /tmp allowance. Orchestrator and security decide whether that is acceptable. If they judge any of these as loosened, that needs full verify.

## Notes

- Scope items from the ticket comments are covered: the one-time warning, log-cell as a wrap-up command, /tmp draft writes, and the developer and qa thresholds.

```json
{
  "ticket": "organism-infra/208-cell-context-hook",
  "cell": "qa",
  "mode": "verify",
  "current_step": "light verify complete: QA pass at 30bf95e; 13/13 specify tests pass unedited; suite 2997/0 from saved output; released at in-review",
  "artifacts": [
    {"path": "scripts/hooks/context-budget.208.test.mjs", "note": "unchanged since 83d3e27"}
  ],
  "decisions": [
    {"decision": "used /tmp/208-tests.txt as the suite result, per the dispatch, instead of re-running npm test", "why": "the dispatch said not to re-run"},
    {"decision": "six older test files edited by the developer are listed, not bounced", "why": "outside my specify tests; light rule only checks my test files"}
  ],
  "failures": [],
  "pending": [
    {"item": "run npm run risk-check; decide whether the six older test edits need full verify", "owner": "orchestrator"}
  ]
}
```
