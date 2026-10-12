# Handoff: queue/03-admission-gate (qa verify, light)

```json
{"ticket": "queue/03-admission-gate", "cell": "qa", "mode": "verify", "current_step": "Light verify escalated to full verify: steps 1, 2 and 4 clean; criterion 4 scope needs a call.",
 "artifacts": ["branch tests/queue-03-admission-gate (verified at b9b5403, specify sha 4df65d9)", "apps/organism-infra/admission-gate.test.mjs"],
 "decisions": ["Dispatch said use the developer's saved npm test output and not re-run the suite; step 1 was read from that file (/tmp/claude-1000/-home-dhertzell-dimsumden/e80ce5e2-9ba4-4603-b81c-6aeb564d4bd9/scratchpad/03-tests.txt)."],
 "failures": [],
 "pending": [{"item": "Full verify on b9b5403. First settle criterion 4: the ticket says board create with --class, --serves, --origin, --p0-reason, but no board create command exists; createTicket is the only write path and is tested. Either accept createTicket as the surface or add a CLI subcommand.", "owner": "qa"}]}
```

## State

Partial: light verify escalated. Not a pass and not a bounce. No --verdict comment was written.

## What changed

Nothing in the branch. QA read only. Ticket comment posted on queue/03-admission-gate.

## Light verify results

1. Suite (saved output, not re-run): tests 4360, pass 4360, fail 0, skipped 0, todo 0. The 33 admission-gate tests are all ok (TAP ids 339 to 371). The test file has no .skip, .todo or .only.
2. Test file diff 4df65d9 to HEAD: empty. No assertion removed or changed.
3. Criterion to test map (apps/organism-infra/admission-gate.test.mjs):
   - 1 checkAdmission decisions 6 and 7 with reasons: lines 102 to 179.
   - 2 pipeline exemption (ADR 0019 decision 8): lines 159, 167, 300.
   - 3 board gate dry run and --apply: lines 420, 443, 459, 488, 502.
   - 4 createTicket lines and P0 refusal: lines 547, 568, 578, 590, 605, 620. Covers createTicket only; see pending.
   - 5 spec path cannot leave .scratch/: lines 334, 342, 363.
   - 6 real usage.jsonl count: human-verified per 03-qa-specify.md. The mark is in the specify handoff, not in the ticket Comments section (specify gap). The developer reports 0 of 10 organism-infra pipeline tickets pass (03-developer.md). I did not re-count.
4. Files changed since 0046e7e: admission-gate.test.mjs, board-service.mjs, board.mjs, frontier-queue.mjs. All four are in the ticket's scope. None outside it.

## Notes for the full verify and the user (not bounces)

- Developer reports 18 ready tickets refused on day one; specify said 13. The board changed in between, probably.
- Developer flags the same-tool rule as loose: tool "other" is 122 of 482 incident rows, so three "other" incidents pass. Spec-level choice for the user.
- Gate parks are recognised by reason prefix; security owns that review.

## Next step

qa full verify on b9b5403, after the user decides criterion 4. Full verify would run scout on the suite again.

## Suggested skills

organism-protocol (verify rules); tdd only if a test is in doubt.

## Gotchas

- The dispatch line and the light genome disagree on step 1 (re-run versus saved output). I followed the dispatch.
- Criterion 6 was marked human-verified only in the specify handoff, so the ticket Comments section has no matching mark.
