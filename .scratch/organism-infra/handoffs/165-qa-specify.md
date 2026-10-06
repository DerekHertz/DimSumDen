```json
{"ticket": "organism-infra/165-context-budget-hook-hardening", "cell": "qa", "mode": "specify",
 "current_step": "PARTIAL. Tests for all three 165 fixes are written and committed (WIP b1c8093, branch tests/batch-c-context-budget) but NOT YET RUN: the cell hit the 80k context stop first.",
 "artifacts": ["scripts/hooks/context-budget.hardening.test.mjs", "scripts/hooks/context-budget.test.mjs (edited)", "scripts/hooks/context-budget.scratchpad.test.mjs (edited)"],
 "decisions": ["Contract: a backslash outside single quotes is chain-unsafe; main checkout = $ORGANISM_ROOT if set, else first entry of `git worktree list` from the call's cwd, and only its .scratch/ (plus the session scratchpad) is a wrap-up write; session_id failing /^[\\w.-]+$/ -> no context.mjs call, allow", "The worktree's own .scratch/ is refused (cells write to the main checkout's board)", "Existing 162 tests edited without loosening: agent_type qa/developer -> security (tier change from 145), and the .scratch wrap-up write now targets <home>/main/.scratch with ORGANISM_ROOT set. Verify should expect that diff.", "Details and the full criterion map are in 145-qa-specify.md (same branch, same relay)"],
 "failures": ["Context hit 80k before the first test run"],
 "pending": [{"item": "Run the 165 test file, confirm each test fails for the right reason (the hook does not yet refuse backslash chains, treats any /.scratch/ as wrap-up, passes any session_id) and that the 'plain wrap-up commands still allowed' and 'scratchpad still allowed' tests pass or fail only for fixture reasons; then re-handoff", "owner": "qa (fresh specify cell, same branch)"}]}
```

## State
Partial; tests written, never executed. See 145-qa-specify.md for the whole batch.

## Criterion map
- Backslash-hidden chain refused: hardening test "a backslash-escaped quote hiding a chain is refused", control "plain wrap-up commands are still allowed".
- `.scratch/` outside the main checkout refused, main checkout and scratchpad allowed: "main checkout .scratch/ ...", "ORGANISM_ROOT ...", "a .scratch/ outside the main checkout is refused", "climbs out", "session scratchpad" tests.
- Invalid session_id fails open: "a session_id that fails /^[\w.-]+$/ ...".
- Existing 162 tests still pass: the two edited files above.
