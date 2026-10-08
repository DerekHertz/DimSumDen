# 202 developer handoff (partial: context budget stop)

Branch feat/202-conformance-spikes-round-4-fixes, WIP commit on top of 3c3c1fc. The tests were NOT run after the edits (only `node --check` passed). No test file was edited.

Done in apps/bridge/cells/conformance.mjs:
- evaluateS4b: `unstarted` now gives setup-invalid (never go, no-go or unconfirmed); new `notes` input printed in the evidence.
- runS4b rewritten: hold file inside each child's own cwd, named by a relative path; allow rule is `Bash(tail -f *)` so the unique file name is not in argv; per-child marker; `toolPids` excludes the child's own pid; tool counts as in flight only with tool_use, no permission_denied, no result yet, and a non-child process carrying the marker; notes name permission_denied or "the turn already ended (result line)".
- evaluateS8: group bits (socket 0o066, dir 0o077) count as OPEN and print "group"; `directory uid <n>` in the evidence; a foreign directory owner turns go into no-go; any probe named control-response* with effect gives outcome d.
- statSocket records dirUid.
- runS8: interrupt effect now needs an error/interrupted tool result or result (a tool ending on its own no longer counts); the user-message probe is re-checked after the turn's result (late nonce, outcome c); second control_response shape probe `control-response-2` (flat shape with request_id and response.behavior) sent after the first, before the stdin deny.
- setupProblems(captures, {spike}): absent init is setup-invalid (skips socket and deny captures, and a child with exit.error); plugins with path other than builtin; hook_started (not for S6b). Both callers pass the spike id.

Left to do (a fresh developer cell):
1. S6b control check (tests 17-20), nothing written yet. Plan: runS6b(ctx, outDir): when `ctx.control` and allowed.txt is absent after the run, save child stderr to `<out>/S6b-control.stderr.txt` (scrubText), then run two comparisons: (a) in the worktree, settings.local.json allow `Write(/<realpath wt>/allowed.txt)` (leading `//` form); (b) cwd = ctx.repo with a temporary `.claude/settings.local.json` allow `Write(allowed.txt)`, no `--agent`, restoring or deleting the file and any allowed.txt so `git status --porcelain` stays empty. Return result with `controlAllowAbsent: true`. In runControl pass `allowAbsent: Boolean(run.result.controlAllowAbsent)`; in runSpikes, when `result.control.allowAbsent`, replace the result with verdict setup-invalid and evidence containing "project allow did not apply in the control", a line that decision 6.10 deny-over-allow stays unverified, and the comparison lines. A spike no-go with a control that did write allowed.txt stays a plain no-go (test 20).
2. Run `node --test apps/bridge/cells/conformance-round4.test.mjs` and fix failures; then `npm test` via a scout (output to /tmp/202-tests.txt); the old conformance.test.mjs must stay green. Risks: the old S4b/S8 tests may need a check against the new setup guard (absent init) and the S4b unstarted change.
3. Update HELP/header text for the new behaviour, and write the run instructions (one screen) for the user in the final handoff.

```json
{
  "ticket": "organism-infra/202-conformance-spikes-round-4-fixes",
  "cell": "developer",
  "current_step": "WIP commit: S4b, S8, socket dir and setup guard code written, tests not yet run; S6b control check not started.",
  "artifacts": [
    {"path": "apps/bridge/cells/conformance.mjs", "note": "WIP edits, committed on the branch"}
  ],
  "decisions": [
    {"decision": "S4b allow rule is the wildcard Bash(tail -f *) so the unique hold file name stays out of the child's argv."},
    {"decision": "Foreign socket directory owner turns S8 go into no-go; OPEN stays evidence only, as before."}
  ],
  "failures": [],
  "pending": [
    {"item": "Implement the S6b control check, run conformance-round4.test.mjs and the full suite, fix failures, write run instructions. See the plan in this handoff.", "owner": "developer"}
  ]
}
```
