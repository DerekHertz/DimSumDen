# 202 qa verify handoff (light verify)

Branch feat/202-conformance-spikes-round-4-fixes, head 5fbe6cf. Ticket status stays `in-review`. Recommendation: QA bounce on one item (check 2, S6b reading). No `--verdict` comment posted; the verdict is left to the orchestrator.

Suite: `/tmp/202-tests.txt` used as the result, not re-run (per orchestrator). 2629 pass, 0 fail, 0 skipped, 0 todo, 0 cancelled.

## Checks

1. Specify tests unchanged. `git diff 3c3c1fc..5fbe6cf -- apps/bridge/cells/conformance-round4.test.mjs` is empty. PASS.

2. Criteria and confirmed readings (test lines are in conformance-round4.test.mjs):
- AC1 stub S4b refused or child-as-tool is setup-invalid: tests 42 (l.145), 44 (l.158). PASS.
- AC2 hold file in child cwd, matcher key absent from argv: tests 46 (l.170), 47 (l.179). PASS.
- AC3 S4b go only with tool_use, no permission_denied, tool pid: tests 42-46 and 144. Reading (1) is implemented as "matched pid is never the child" at conformance.mjs:973-980 and used at :1005. PASS.
- AC4 S8 late nonce is outcome c, interrupts still no effect: tests 52 (l.325), 53 (l.333). PASS.
- AC5 second control_response shape reported separately: tests 48 (l.207), 54 (l.339). PASS.
- AC6 S6b setup-invalid with stderr saved, control-allow-absent: tests 56 (l.396), 57 (l.402), 58 (l.409), 59 (l.417). PASS.
- AC7 socket dir owner uid and group bits: tests 50 (l.225), 51 (l.235), 55 (l.354). PASS.
- AC8 absent init, unknown plugins, hook_started named as setup-invalid: loops at l.453-476, test at l.479. PASS for S1, S4b, S8 on hook_started.
- AC9 run instructions fit one screen: 202-developer-2.md lines 19-28, about 12 lines. PASS.
- Reading (2) S6b excluded from the hook_started guard: implemented at conformance.mjs:485 (`spike !== "S6b"`). No test covers it. The hook_started loop (l.471) lists S1, S4b, S8 only, and no test asserts that an S6b run with hook_started is not setup-invalid. FAIL (missing test).

3. S6b restore.
- Code: compareS6bAllow (conformance.mjs:1111-1139) restores the checkout's settings.local.json in a `finally`, so it runs on normal completion and on throw. It writes the original bytes, or removes the file if none existed. PASS on code.
- Test conformance-s6b-restore.test.mjs covers one path: a pre-existing settings file, and the child never writes allowed.txt. It asserts verdict setup-invalid, the bytes, and clean `git status`. Weak: runS6b sets controlAllowAbsent before the comparison runs, so the verdict does not prove the comparison ran. The test would still pass if compareS6bAllow were deleted. Not covered: the absent-file branch (rmSync) and the throw path.
- Not restored: `made[]` (conformance.mjs:1124) lists only files that did not exist before, so an allowed.txt or deny target already in the checkout can be overwritten and not put back.

4. Run instructions. Fit on one screen. PASS.

## Light-verify steps
1. npm test: substituted by the saved output above (per orchestrator). Nothing skipped.
2. Test-file diff: empty. No removed or loosened assertion.
3. Criterion map: AC1-AC9 each name a passing test. The S6b reading has code but no test (see check 2).
4. Files touched outside the ticket's named file: apps/bridge/cells/conformance-s6b-restore.test.mjs (new, developer-added, same directory). Listed, not judged.

## Judgment calls for the orchestrator
- The S6b reading gap is a bounce for check 2 as asked. The fix is a test: an S6b run with a hook_started event is not setup-invalid by the guard. Specify left S6b out of the hook loop without a positive test, so part of this is a gap in my specify tests.
- The restore-test weakness and the pre-existing-file overwrite are non-blocking findings. Whether they block is not mine to rule on. If you want a ruling, escalate to full verify.
- The developer skipped the /code-review pass. Not run here.

```json
{
  "ticket": "organism-infra/202-conformance-spikes-round-4-fixes",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify done. Checks 1, 3 (code), 4 pass. Check 2 fails on the S6b hook_started reading (no test). Recommend bounce; no verdict comment posted.",
  "artifacts": [
    {"path": "apps/bridge/cells/conformance.mjs", "note": "reviewed; S6b hook_started exclusion at l.485 has no test; compareS6bAllow restore at l.1111-1139 is in a finally; made[] at l.1124 does not protect pre-existing files"},
    {"path": "apps/bridge/cells/conformance-s6b-restore.test.mjs", "note": "reviewed; one happy-path test; does not prove the comparison ran"}
  ],
  "decisions": [
    {"decision": "Suite result taken from /tmp/202-tests.txt; npm test not re-run, per orchestrator instruction."},
    {"decision": "No --verdict comment posted; the bounce decision is left to the orchestrator."}
  ],
  "failures": [],
  "pending": [
    {"item": "Decide on the bounce. If bounced, the developer adds a test that an S6b run with hook_started is not setup-invalid, and optionally strengthens the restore test.", "owner": "orchestrator"}
  ]
}
```
