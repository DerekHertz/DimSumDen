# 202 qa specify handoff

Branch: feat/202-conformance-spikes-round-4-fixes, commit 3c3c1fc. Test file: apps/bridge/cells/conformance-round4.test.mjs (38 tests; 34 fail for a missing feature, 4 pass as guards). Existing conformance.test.mjs is untouched and must stay green.

```json
{
  "ticket": "organism-infra/202-conformance-spikes-round-4-fixes",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Tests written and committed (3c3c1fc). 34 of 38 fail as expected; the other 4 are regression guards. Context budget stop hit before a per-test check of each failure reason.",
  "artifacts": [
    {"path": "apps/bridge/cells/conformance-round4.test.mjs", "note": "new tests, commit 3c3c1fc"}
  ],
  "decisions": [
    {"decision": "Criterion 'tool pid whose ppid chain does not include the child' read as: the matched pid is never the child itself (a real tool is a descendant of the child, so the literal reading would reject every valid run). Architect please confirm."},
    {"decision": "Unstarted S4b tool (tool_use missing, permission_denied seen, only the child matches, or turn already ended) -> evaluateS4b verdict setup-invalid; evaluator input stays unstarted: [names]."},
    {"decision": "Absent init is setup-invalid except when the child failed to start (spawn error stays no-go, existing test). Skip the S8 socket capture and the S3 deny slice, which have no init by design. An init with no plugins field is fine; plugins with path other than 'builtin' are invalid. Any hook_started is invalid."},
    {"decision": "evaluateS8 stat gains dirUid; evidence line 'directory uid <n>'; dirUid != ownUid is not a go; group bits 0o070 on socket and directory print OPEN and mention 'group'. Second control_response probe is named control-response-2 (any name starting control-response with effect gives outcome d)."}
  ],
  "failures": [],
  "pending": [
    {"item": "Make conformance-round4.test.mjs pass without editing it; keep conformance.test.mjs green. Criterion map: S4b stub (deny/noTool/selfTitle/endTurnEarly) = tests 3-6 plus evaluator 1-2; hold file in cwd = test 7; marker absent from argv = test 8; ppid/child pid = test 5; evaluateS8 polling = S8 runner tests 13-14; second shape = evaluator test 9 and runner test 15; S6b control = tests 17-19 (stderr file saved in out dir, absolute or // allow run, main checkout cwd run, checkout left clean); socket dir owner/group = evaluator tests 11-12 and runner test 16; setup guard = tests 21-37; run instructions on one screen = human-verified.", "owner": "developer"},
    {"item": "Risk for the architect: S6b runs in a worktree of this repo whose project settings may define SessionStart hooks, so the hook_started guard could make S6b always setup-invalid. Tests exclude S6b from the hook case. Decide whether a known project hook set is allowed.", "owner": "architect"}
  ]
}
```
