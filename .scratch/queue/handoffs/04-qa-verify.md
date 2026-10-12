```json
{"ticket": "queue/04-queue-admin-user-entry-point", "cell": "qa", "mode": "verify", "current_step": "Light verify bounced on one loosened assertion in scripts/queue-admin.test.mjs (assertUntouched allow list). All other light-verify steps pass.",
 "artifacts": ["scripts/queue-admin.test.mjs", "/tmp/claude-1000/-home-dhertzell-dimsumden/c0f2c4c8-bdab-4cfb-9333-fca2b283a86d/scratchpad/04-tests.txt"],
 "decisions": ["Suite result taken from the saved developer output (4382 pass, 0 fail, 0 skipped); npm test not re-run, per the dispatch line"],
 "failures": ["Light verify step 2: assertUntouched readdir expectation loosened by an allow list (scripts/queue-admin.test.mjs:96 and the calls at :232, :262, :268, :291, :306)"],
 "pending": [{"item": "Make the .scratch directory check exact again: snapshot .scratch after putTicket and compare the listing to that snapshot, or list the allowed names only from the fixture, so a stray entry still fails. Re-run and re-publish the handoff.", "owner": "developer"}]}
```

## State

Bounced (light verify). One finding, fix is narrow. Every other check passed.

## What changed (verified)

- Branch `tests/queue-04-queue-admin-user-entry-point`, HEAD 87ff7a3. Specify commit c3db336.
- `git diff --stat c3db336 HEAD`: apps/organism-infra/frontier-queue.mjs, package.json, scripts/queue-admin.mjs (in scope); scripts/queue-admin.test.mjs (qa test file); scripts/queue.test.mjs (queue/02 test file, outside the ticket's listed scope, see below).
- `.claude/settings.json` is not in the diff. Criterion 4 holds: the deny patch sits in 04-developer.md, unapplied.
- Saved suite output (04-tests.txt): tests 4382, pass 4382, fail 0, skipped 0, todo 0. It includes the developer's new ruling tests as `ok`.

## Findings

- scripts/queue-admin.test.mjs:96 `assertUntouched` now compares `.scratch` against `[...before, ...allow]` (the `allow` option was added at :86). Callers pass `{ allow: ["den-v1"] }` at :232, :262, :268, :291 and :306. This is a loosened assertion, so light verify bounces it. The intent holds for the usage file (still byte-compared), but the listing check no longer catches a stray `den-v1` entry. Fix as in the pending item.
- The developer handoff (04-developer.md, item 3) says the /dev/null admit test "asserts no usage.jsonl and that the prompt names the ref, instead of calling assertUntouched". The diff at :268 still calls `assertUntouched(root, null, "devnull", r, ...)`. Make the handoff match the code when you re-publish.

## Criterion to test map

1. active with y writes one queue_active row; otherwise nothing and nonzero: "active <feature> with y on stdin appends exactly one queue_active config row by the user"; "active with stdin ..." (n, empty, EOF, yes, Y, yy, no, x then y); "/dev/null stdin".
2. admit with y, refuses missing reason: "admit <ref> --reason with y ... queue-admit row by the user"; "admit with stdin ..."; "admit with a /dev/null stdin"; "admit refuses a missing, empty or blank reason and a missing ref".
3. board queue active tier and admitted ticket: "board queue puts the active feature's tickets first ..."; "board gate lists a refused ticket until queue-admin admit with y ..."; "loadSnapshot and gateRefusals: a queue-admit row admits exactly the ticket it names".
4. human-verified (specify). Checked by reading the handoff and `git diff --stat`.
5. human-verified (specify). The handoff states the `!npm run queue-admin` check was not tested, which the criterion allows.
- Ruling 1 (ref must be a real ticket): "admit refuses a ref that names no ticket ..."
- Ruling 2 (by:user enforced): "loadSnapshot ignores a queue-admit row without by:user"; "... ignores a queue_active row without by:user ...".
- Ruling 3 (cwd / ORGANISM_ROOT / --root): three "with no --root ..." and "$ORGANISM_ROOT ..." tests.

## Out-of-scope files (listed, not judged)

- scripts/queue.test.mjs: three queue/02 fixtures gained `by: "user"` (lines 106, 121, 190). Assertions unchanged. The change follows ruling 2. Security or the orchestrator should look at it.

## Decisions made

- Bounce, not escalate. Step 2's rule (loosened assertion = bounce) is mechanical. The allow list is narrow, so the fix is small.

## Next step

Developer: fix scripts/queue-admin.test.mjs:96 as in the pending item, correct the handoff item 3 wording, re-run, re-publish. Then qa verify (light) again.

## Suggested skills

tdd (for the test fix), organism-protocol.

## Gotchas

- `npm test` was not re-run here (dispatch said to use the saved output). The developer handoff says the full suite ran before the queue.test.mjs fixture fix and was not re-run after; the saved output shows all green, so its commit is not confirmed.
