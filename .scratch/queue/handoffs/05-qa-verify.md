# Handoff: queue/05-decay-pick-and-unplanned-cap (qa verify, light)

```json
{
  "ticket": "queue/05-decay-pick-and-unplanned-cap",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify done. Verdict QA pass on branch tests/queue-05-decay-pick-and-unplanned-cap at HEAD 5ed03a2. npm test at HEAD: 4403 pass, 0 fail, 0 skipped. The only change to the specify test file since specify commit 47c0146 is the test 5 pick timestamp (plus a comment), and no assertion was removed or loosened.",
  "artifacts": [
    "branch tests/queue-05-decay-pick-and-unplanned-cap, HEAD 5ed03a2 (specify 47c0146, developer a8ffdbe, qa fix 5ed03a2)",
    "apps/organism-infra/queue-decay.test.mjs",
    "scratchpad 05-qa-verify-tests.txt (npm test output at HEAD)"
  ],
  "decisions": [
    "Ran npm test at HEAD myself, although the dispatch said to use the saved developer output. The saved file (05-tests.txt) records no commit, and the developer's note says test 5 failed at a8ffdbe, so its provenance can't be tied to HEAD. Both runs report 4403 pass, 0 fail, 0 skipped.",
    "Test 5 (queue-decay.test.mjs:123-141): the diff since 47c0146 changes only the picked ticket's pick ts from 2026-10-07T00:00Z to 2026-10-08T00:00Z. Under ADR 0015 Amendment 3, a pick after every resolved row leaves full decay 5, which is what the assertion checks. The assertions are unchanged, so this is not a loosening. The developer's reading (decayLeft 4 with the pick at 10-07T00:00) is also consistent with the ADR, and the fixture change only pins the intended case.",
    "Files touched on the branch since cf17657 (outside the ticket's named scope): none. The three files are apps/organism-infra/board.mjs, frontier-queue.mjs and queue-decay.test.mjs, all named in the ticket."
  ],
  "failures": [],
  "pending": []
}
```

## Verdict

QA pass (light verify).

## Steps

1. `npm test` at HEAD 5ed03a2: tests 4403, pass 4403, fail 0, cancelled 0, skipped 0, todo 0.
2. `git diff 47c0146 HEAD -- apps/organism-infra/queue-decay.test.mjs`: one hunk, lines 129-133. Pick ts moved to 2026-10-08T00:00:00Z and a comment added. No removed or loosened assertion.
3. Criterion to test map (all in apps/organism-infra/queue-decay.test.mjs):
   - Decay left falls as tickets resolve and resets on pick, literal rows: lines 68 (falls), 84 (pick resets), 102 (other pick does not reset), 371 (board queue shows fall and reset).
   - `board pick` writes one queue-pick row: line 319 (one row, picked, top, no deviation, status unchanged). Refusal writes nothing: line 357.
   - `--deviation` records the reason: line 341.
   - `board gate` dry run lists the expired ticket and writes nothing: line 419. `--apply` parks it and only it: line 440. Unpark restarts decay: line 466.
   - Over-cap added ticket refused with a reason: line 166 (reason names the cap, one line). Under-cap admitted: 175. Planned tickets never refused: 187.
   - Security finding over the cap admitted and counted: line 202. Gate lists the over-cap ticket and not the finding: lines 226 and 483.
   - Human-verified criteria: none.
4. Files touched outside scope: none.

## Notes

- Edge cases covered: decay floors at 0 (line 138), exactly 4 versus 5 resolved (line 143), an active-feature ticket never expires (line 115), and a cap that counts only the ticket's own feature (line 195).
- No failed calls in this session.
