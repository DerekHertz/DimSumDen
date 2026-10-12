```json
{"ticket": "queue/04-queue-admin-user-entry-point", "cell": "qa", "mode": "verify", "current_step": "Light verify round 2 passes. The round 1 loosened .scratch listing check is exact again. Verdict QA pass; the full security review the ticket requires is next.", "artifacts": ["scripts/queue-admin.test.mjs", "scripts/queue.test.mjs"], "decisions": ["Step 1 used the saved developer suite output (04-tests-2.txt: 4382 pass, 0 fail, 0 skipped) and did not re-run npm test, because the dispatch line said so. The genome's light step 1 says to run it; this is a deliberate deviation. The saved file (mtime 10:45:53) is later than the branch tip commit (10:43:13)."], "failures": [], "pending": [{"item": "npm run risk-check, then the full security review (ticket 04 is marked Security: full, permission boundary)", "owner": "security"}, {"item": "Criteria 4 and 5 are human-verified (deny patch unapplied in 04-developer.md; !npm run queue-admin under the deny rules, or the handoff says it is untested). Apply the deny patch at ticket 07.", "owner": "orchestrator"}]}
```

## State

Done: light verify round 2 on branch `tests/queue-04-queue-admin-user-entry-point`, tip 8864f42. All four light steps pass. Verdict: QA pass.

## What changed (verified)

- Specify commit c3db336, developer commit 87ff7a3, fix commit 8864f42.
- `git diff --stat c3db336 8864f42`: `apps/organism-infra/frontier-queue.mjs`, `package.json`, `scripts/queue-admin.mjs` (ticket scope); `scripts/queue-admin.test.mjs` (qa test file); `scripts/queue.test.mjs` (queue/02 test file).
- `.claude/settings.json` is not in the diff.

## Light verify steps

1. Suite (saved output, not re-run): tests 4382, pass 4382, fail 0, cancelled 0, skipped 0, todo 0. The ruling tests appear as `ok` (saved output lines 26124-26179).
2. Test file diffs since c3db336:
   - `scripts/queue-admin.test.mjs`: no assertion removed or weakened. The round 1 `allow` option is gone. `assertUntouched` now compares the `.scratch` listing exactly to `snapshotScratch()`, taken after `putTicket` (`:87`, `:99`). Callers without the option keep the old expectation. `admin()` now drops an inherited `ORGANISM_ROOT` (`:50`), which only tightens the setup.
   - `scripts/queue.test.mjs`: three fixture rows gained `by: "user"` (lines 106, 121, 190). Assertions unchanged.
3. Criterion to test map (file `scripts/queue-admin.test.mjs` unless noted):
   - 1 (active, y writes one row, else nothing and nonzero): "active <feature> with y on stdin appends exactly one queue_active config row by the user"; "active with stdin ..."; "/dev/null stdin".
   - 2 (admit, y, refuses missing reason): "admit <ref> --reason with y ... queue-admit row by the user"; "admit with stdin ..."; "admit with a /dev/null stdin"; "admit refuses a missing, empty or blank reason and a missing ref".
   - 3 (board queue active tier, admitted ticket): "board queue puts the active feature's tickets first after queue-admin active (and not before)"; "board gate lists a refused ticket until queue-admin admit with y; gate --apply then leaves it ready"; "loadSnapshot and gateRefusals: a queue-admit row admits exactly the ticket it names".
   - 4 and 5: human-verified (per specify).
   - Ruling 1 (admit refuses a non-ticket ref): "admit refuses a ref that names no ticket, or is not shaped like a ref, even with y".
   - Ruling 2 (by:user enforced): "loadSnapshot ignores a queue-admit row without by:user"; "loadSnapshot ignores a queue_active row without by:user, and a later user row still wins".
   - Ruling 3 (no --root): "with no --root, run from a worktree, the row is written in the main checkout"; "with no --root, $ORGANISM_ROOT is the main checkout, and --root still wins over it"; "with no --root, outside any checkout and with no $ORGANISM_ROOT, it refuses and writes nothing".
   - Also: "package.json has a queue-admin script".
4. Files outside the ticket's listed scope (listed, not judged): `scripts/queue.test.mjs` (queue/02 fixtures, `by: "user"` only, after ruling 2). Security or the orchestrator decides.

## Decisions made

- The round 1 finding (`scripts/queue-admin.test.mjs:96`) is fixed. The developer's correction to item 3 of 04-developer.md is in 04-developer-2.md.
- No light-verify step needed judgment, so no escalation.

## Next step

Security: `npm run risk-check`, then the full security review on the permission boundary. Criteria 4 and 5 remain human checks for the orchestrator.

## Suggested skills

organism-protocol (for the security cell), tdd if the security cell asks for test changes.

## Gotchas

- None.
